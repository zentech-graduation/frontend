#!/usr/bin/env python3
"""Seed demo data for Luvax through the public HTTP API only.

This script never touches the database. Every row it creates is created by a request
a browser could make, which is what makes it double as an executable check of the
documented API contract: if the contract in docs/reconnaissance/backend-api-contract.md
is wrong, this script fails.

Run it after both applications are already running. It is idempotent: running it twice
produces the same graph and exits 0 both times.

Configuration comes from the environment:

  LUVAX_API_BASE_URL   base URL including the version prefix
                       (default http://localhost:8080/api/v1)
  LUVAX_SEED_PASSWORD  password used for every seeded account
                       (default ReconPass123!)
  LUVAX_SEED_DOMAIN    email domain for seeded accounts
                       (default example.com)

Only the standard library is used, so it runs unmodified inside the backend container.
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("LUVAX_API_BASE_URL", "http://localhost:8080/api/v1").rstrip("/")
PASSWORD = os.environ.get("LUVAX_SEED_PASSWORD", "ReconPass123!")
DOMAIN = os.environ.get("LUVAX_SEED_DOMAIN", "example.com")

# Marker embedded in every caption this script writes. Existing posts carrying the
# marker are treated as already seeded, which is what makes post creation idempotent:
# the post endpoint has no Idempotency-Key support, unlike the comment endpoint.
MARKER = "[luvax-seed]"

TIMEOUT = 20

# Duplicate-attempt error codes that mean "already in the desired state". Every one of
# these is returned with HTTP 409 and is a success for seeding purposes.
ALREADY_DONE = {
    "USER_ALREADY_EXISTS",
    "USER_EMAIL_ALREADY_EXISTS",
    "USER_USERNAME_ALREADY_EXISTS",
    "SOCIAL_ALREADY_FOLLOWING",
    "SOCIAL_ALREADY_REQUESTED",
    "SOCIAL_ALREADY_BLOCKED",
    "POST_ALREADY_LIKED",
    "POST_ALREADY_SAVED",
    "COMMENT_ALREADY_LIKED",
    "MEDIA_STORAGE_KEY_ALREADY_EXISTS",
    "REPORT_DUPLICATE",
}

blockers = []
created = {"users": 0, "posts": 0, "comments": 0, "follows": 0, "likes": 0, "saves": 0}


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(f"{status} {code}: {message}")
        self.status = status
        self.code = code
        self.message = message


def call(method, path, token=None, body=None, headers=None):
    """Issue one API request and return the unwrapped `data` field.

    Raises ApiError on any non-2xx response so callers can decide what to tolerate.
    """
    url = BASE + path
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Accept", "application/json")
    if payload is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    for key, value in (headers or {}).items():
        req.add_header(key, value)

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw).get("data")
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw)
            raise ApiError(err.code, parsed.get("code", ""), parsed.get("message", ""))
        except json.JSONDecodeError:
            raise ApiError(err.code, "", raw[:200])
    except urllib.error.URLError as err:
        raise ApiError(0, "UNREACHABLE", f"{url} is not reachable: {err.reason}")


def tolerant(method, path, token=None, body=None, headers=None):
    """Call the API, swallowing the 409 that means the effect is already in place."""
    try:
        return call(method, path, token, body, headers)
    except ApiError as err:
        if err.code in ALREADY_DONE:
            return None
        raise


def log(message):
    print(message, flush=True)


def register(username):
    """Register an account, tolerating one that already exists."""
    try:
        call(
            "POST",
            "/auth/register",
            body={
                "username": username,
                "email": f"{username}@{DOMAIN}",
                "password": PASSWORD,
                "displayName": username.replace("_", " ").title(),
            },
        )
        created["users"] += 1
        log(f"  registered {username}")
    except ApiError as err:
        if err.code == "USER_ALREADY_EXISTS":
            log(f"  {username} already exists")
        else:
            raise


def login(username):
    """Log in and return (accessToken, userId), or None when the account is unusable."""
    try:
        data = call(
            "POST",
            "/auth/login",
            body={"identifier": f"{username}@{DOMAIN}", "password": PASSWORD},
        )
    except ApiError as err:
        if err.code == "AUTH_EMAIL_NOT_VERIFIED":
            blockers.append(
                f"{username}: email is not verified, so this account cannot be used. "
                "Verification needs a token that is only delivered by email, and the "
                "local mail provider rejects the seed email domain. There is no HTTP "
                "endpoint that verifies an address without that token, so this script "
                "cannot resolve it without writing to the database. "
                "See docs/reconnaissance/seed-data.md for the manual step."
            )
            return None
        raise
    return data["accessToken"], data["user"]["id"]


def owned_seed_posts(token, user_id):
    """Return {caption: postId} for posts this script already created for a user."""
    found = {}
    cursor = None
    while True:
        path = f"/posts/user/{user_id}?limit=50"
        if cursor:
            path += "&cursor=" + cursor
        page = call("GET", path, token)
        for post in page["content"]:
            caption = post.get("caption") or ""
            if MARKER in caption:
                found[caption] = post["id"]
        info = page["pageInfo"]
        if not info["hasNextPage"]:
            return found
        cursor = info["endCursor"]


def ensure_post(token, user_id, existing, caption, media_ids=None):
    """Create a post unless one with the same marker caption is already present."""
    if caption in existing:
        return existing[caption]
    body = {
        "caption": caption,
        "postType": "image" if media_ids else "text",
    }
    if media_ids:
        body["mediaIds"] = media_ids
    post = call("POST", "/posts", token, body)
    created["posts"] += 1
    existing[caption] = post["id"]
    return post["id"]


def ensure_media(token):
    """Register one media asset so at least one post carries media.

    The upload-complete endpoint performs no server-side object inspection, so the
    asset row is created without transferring any bytes to object storage. The CDN URL
    will therefore 404 in a browser; this exists to exercise the media relation on a
    post, not to provide a renderable image.
    """
    try:
        signed = call(
            "POST",
            "/media/upload",
            token,
            {"mediaType": "IMAGE", "mimeType": "image/jpeg", "fileSize": 1048576},
        )
        asset = call(
            "POST",
            "/media/upload-complete",
            token,
            {
                "storageKey": signed["storageKey"],
                "mediaType": "IMAGE",
                "mimeType": "image/jpeg",
                "fileSize": 1048576,
                "width": 1080,
                "height": 1080,
                "duration": None,
                "blurhash": "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
            },
        )
        return asset["id"]
    except ApiError as err:
        blockers.append(
            f"media asset could not be registered ({err}); the seeded posts are all "
            "text-only. Object storage credentials are required for the pre-signed "
            "URL step."
        )
        return None


def comment(token, post_id, content, parent_id=None, key=None):
    """Create a comment, using the Idempotency-Key header so a replay is a no-op."""
    body = {"postId": post_id, "content": content}
    if parent_id:
        body["parentId"] = parent_id
    headers = {"Idempotency-Key": key} if key else None
    result = call("POST", f"/posts/{post_id}/comments", token, body, headers)
    created["comments"] += 1
    return result["id"]


def main():
    log(f"Seeding against {BASE}")

    # 1. Accounts. Four are needed: a viewer, a mutual, a private account to exercise
    #    follow requests, and one to block and unblock.
    log("accounts")
    names = ["luvax_ava", "luvax_ben", "luvax_cleo", "luvax_dan"]
    for name in names:
        register(name)

    sessions = {}
    for name in names:
        session = login(name)
        if session is None:
            continue
        sessions[name] = session

    if len(sessions) < len(names):
        log("")
        log("BLOCKED: not every seeded account could log in.")
        for item in blockers:
            log("  - " + item)
        return 1

    tok = {name: sessions[name][0] for name in names}
    uid = {name: sessions[name][1] for name in names}

    # 2. Follow graph with edges in both directions. Ava and Ben follow each other,
    #    Dan follows Ava one-way, and Cleo is private so Ava's follow stays pending.
    log("follow graph")
    tolerant("POST", f"/social/follow/{uid['luvax_ben']}", tok["luvax_ava"])
    tolerant("POST", f"/social/follow/{uid['luvax_ava']}", tok["luvax_ben"])
    tolerant("POST", f"/social/follow/{uid['luvax_ava']}", tok["luvax_dan"])
    tolerant("POST", f"/social/follow/{uid['luvax_dan']}", tok["luvax_ava"])
    created["follows"] = 4

    call("PATCH", "/users/me", tok["luvax_cleo"], {"isPrivate": True})
    tolerant("POST", f"/social/follow/{uid['luvax_cleo']}", tok["luvax_ava"])
    log("  ava<->ben mutual, ava<->dan mutual, ava->cleo pending (cleo is private)")

    # 3. Posts. Ben's posts are what Ava sees in her feed, since the feed carries
    #    followed authors only and never the viewer's own posts.
    log("posts")
    media_id = ensure_media(tok["luvax_ben"])

    ben_existing = owned_seed_posts(tok["luvax_ben"], uid["luvax_ben"])
    ben_posts = []
    ben_posts.append(
        ensure_post(
            tok["luvax_ben"],
            uid["luvax_ben"],
            ben_existing,
            f"{MARKER} light is the medium, not the message #observation",
        )
    )
    ben_posts.append(
        ensure_post(
            tok["luvax_ben"],
            uid["luvax_ben"],
            ben_existing,
            f"{MARKER} morning, window, coffee #photography",
            [media_id] if media_id else None,
        )
    )
    ben_posts.append(
        ensure_post(
            tok["luvax_ben"],
            uid["luvax_ben"],
            ben_existing,
            f"{MARKER} grain on film is the texture of memory #film",
        )
    )

    ava_existing = owned_seed_posts(tok["luvax_ava"], uid["luvax_ava"])
    ava_post = ensure_post(
        tok["luvax_ava"],
        uid["luvax_ava"],
        ava_existing,
        f"{MARKER} my own post, editable and deletable in the demo #luvax",
    )

    dan_existing = owned_seed_posts(tok["luvax_dan"], uid["luvax_dan"])
    dan_post = ensure_post(
        tok["luvax_dan"],
        uid["luvax_dan"],
        dan_existing,
        f"{MARKER} this disappears from the feed once dan is blocked #recon",
    )
    log(f"  {len(ben_posts)} by ben, 1 by ava, 1 by dan")

    # 4. Comment tree reaching the maximum depth the backend accepts. The cap is 10,
    #    enforced both by CommentServiceImpl.MAX_DEPTH and by a CHECK constraint on
    #    comments.depth, so the deepest reply carries depth 10.
    log("comment tree")
    root = comment(
        tok["luvax_ava"], ben_posts[0], "a top-level comment", key="seed-c-root"
    )
    parent = root
    speakers = [tok["luvax_ben"], tok["luvax_ava"]]
    for depth in range(1, 11):
        parent = comment(
            tok["luvax_ava" if depth % 2 == 0 else "luvax_ben"],
            ben_posts[0],
            f"reply at depth {depth}",
            parent_id=parent,
            key=f"seed-c-d{depth}",
        )
    log("  root plus replies down to depth 10 (the backend maximum)")

    # Two more top-level comments so the pinned block is visibly distinct from the
    # chronological body. The pinned block holds the three most-liked top-level
    # comments and only admits comments with at least one like.
    quiet = comment(
        tok["luvax_dan"], ben_posts[0], "a newer comment nobody liked", key="seed-c-quiet"
    )
    popular = comment(
        tok["luvax_dan"], ben_posts[0], "an older comment everyone liked", key="seed-c-pop"
    )

    # 5. Likes distributed unevenly, so ordering by like count differs from ordering
    #    by time. `popular` was written last but collects the most likes, which puts it
    #    at the head of the pinned block while the chronological body starts elsewhere.
    #    Note that an author cannot like their own comment (403 COMMENT_FORBIDDEN), so
    #    Dan is absent from the likers of the two comments he wrote. Posts do not share
    #    this restriction: liking your own post succeeds.
    log("likes and saves")
    for name in ["luvax_ava", "luvax_ben"]:
        tolerant("POST", f"/comments/{popular}/like", tok[name])
        created["likes"] += 1
    tolerant("POST", f"/comments/{root}/like", tok["luvax_ben"])
    created["likes"] += 1

    tolerant("POST", f"/posts/{ben_posts[0]}/like", tok["luvax_ava"])
    tolerant("POST", f"/posts/{ben_posts[0]}/like", tok["luvax_dan"])
    tolerant("POST", f"/posts/{ben_posts[1]}/like", tok["luvax_ava"])
    created["likes"] += 3

    tolerant("POST", f"/posts/{ben_posts[1]}/save", tok["luvax_ava"])
    tolerant("POST", f"/posts/{ben_posts[2]}/save", tok["luvax_ava"])
    created["saves"] += 2
    log("  comment likes 2/1/0, post likes 2/1/0, 2 saved posts for ava")

    # 6. One report, so the moderation surface is not empty. Reports are write-only
    #    for a regular account: listing them requires a moderator or administrator.
    tolerant(
        "POST",
        "/reports",
        tok["luvax_ava"],
        {
            "reportType": "post",
            "reportReason": "spam",
            "entityId": dan_post,
            "description": "seeded report",
        },
    )

    log("")
    log("Seed complete.")
    log(f"  base URL      {BASE}")
    log(f"  accounts      {', '.join(names)}")
    log(f"  password      {PASSWORD}")
    log(f"  demo viewer   luvax_ava")
    log(f"  ava feed      {len(ben_posts)} posts by luvax_ben")
    log(f"  ava own post  {ava_post}")
    log(f"  block target  luvax_dan (post {dan_post})")

    if blockers:
        log("")
        log("Could not create:")
        for item in blockers:
            log("  - " + item)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ApiError as exc:
        print(f"\nFAILED: {exc}", file=sys.stderr)
        sys.exit(1)
