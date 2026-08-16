#!/usr/bin/env python3
"""Seed a large, curated Luvax dataset with real media through the public API.

Every post image, carousel frame, video, and avatar is a real file: it is
downloaded from a public source and uploaded through the same pre-signed R2 flow
a browser uses, so the CDN URLs render in the app rather than 404ing.

Accounts are the one thing this script cannot create through the API alone. A new
account must verify its email before it can log in, and verification needs a token
delivered only by email; there is no HTTP endpoint that verifies an address
without that token. So each account is registered through the API and then flipped
to verified with a single SQL statement over `docker exec`, exactly as
`backend/scripts/seed-dev-data.sh` does and for the same reason.

Run it after the stack is up (backend on 8080, Postgres in docker). It is
idempotent at the account and post level: existing accounts are reused, and a user
who already has this script's marker posts is skipped, so a second run does not
re-upload their media.

Environment:
  LUVAX_API_BASE_URL   default http://localhost:8080/api/v1
  LUVAX_SEED_PASSWORD  default Password123!
  LUVAX_SEED_DOMAIN    default luvax.test
  LUVAX_PG_CONTAINER   default backend-postgres-1
  LUVAX_PG_USER        default luvax
  LUVAX_PG_DB          default luvax
  LUVAX_SEED_SCALE     full | small   (default full)

Only the standard library is used, plus the docker CLI for the verify step.
"""

import json
import os
import random
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("LUVAX_API_BASE_URL", "http://localhost:8080/api/v1").rstrip("/")
PASSWORD = os.environ.get("LUVAX_SEED_PASSWORD", "Password123!")
DOMAIN = os.environ.get("LUVAX_SEED_DOMAIN", "luvax.test")
PG_CONTAINER = os.environ.get("LUVAX_PG_CONTAINER")  # None -> auto-detect the running one
PG_USER = os.environ.get("LUVAX_PG_USER", "luvax")
PG_DB = os.environ.get("LUVAX_PG_DB", "luvax")
SCALE = os.environ.get("LUVAX_SEED_SCALE", "full")

# A single "major" review account, created every run, that follows every seeded
# user so its feed shows the whole dataset - the most authentic review experience.
# Its credentials are printed at the end of every run.
REVIEWER_USERNAME = os.environ.get("LUVAX_REVIEWER_USERNAME", "JohnDoe")
REVIEWER_PASSWORD = os.environ.get("LUVAX_REVIEWER_PASSWORD", "Password123!")
REVIEWER_NAME = os.environ.get("LUVAX_REVIEWER_NAME", "John Doe")
REVIEWER_EMAIL = f"{REVIEWER_USERNAME.lower()}@{DOMAIN}"

MARKER = "​"  # zero-width space appended to every seeded caption, invisible to readers
TIMEOUT = 60
BLURHASH = "LKO2?U%2Tw=w]~RBVZRi};RPxuwH"

random.seed(20260816)

ALREADY_DONE = {
    "USER_ALREADY_EXISTS",
    "USER_EMAIL_ALREADY_EXISTS",
    "USER_USERNAME_ALREADY_EXISTS",
    "SOCIAL_ALREADY_FOLLOWING",
    "SOCIAL_ALREADY_REQUESTED",
    "SOCIAL_CANNOT_FOLLOW_SELF",
    "POST_ALREADY_LIKED",
    "POST_ALREADY_SAVED",
    "COMMENT_ALREADY_LIKED",
    "COMMENT_FORBIDDEN",
}

stats = {
    "users": 0, "avatars": 0, "banners": 0, "posts": 0, "media": 0,
    "follows": 0, "post_likes": 0, "saves": 0, "comments": 0,
    "replies": 0, "comment_likes": 0,
}


# ---- curated people -------------------------------------------------------

PEOPLE = [
    ("Mara Vance", "photographer chasing north light"),
    ("Idris Kone", "film stills / grain over pixels"),
    ("Sol Reyes", "surf, salt, and slow mornings"),
    ("Noa B端rgi", "type designer. serifs mostly."),
    ("Lea Petrov", "climbing dirtbag with a camera"),
    ("Jae Okoro", "street photography, lagos & london"),
    ("Ren Kato", "ceramics and quiet rooms"),
    ("Ava Lindqvist", "cold water swimmer"),
    ("Tomas Feld", "architecture, concrete, shadow"),
    ("Priya Nair", "botanist. plants over people."),
    ("Kai Mwangi", "trail runner, 6am club"),
    ("Elena Rossi", "pasta, light, and my nonna"),
    ("Dario Costa", "vinyl, coffee, analog everything"),
    ("Yuki Tanabe", "minimal interiors + tea"),
    ("Freya Holm", "arctic seasons, long exposures"),
    ("Mateo Cruz", "skate, grain, and the golden hour"),
    ("Zola Dube", "textiles and bold colour"),
    ("Hugo Marchand", "baker. sourdough diaries."),
    ("Nina Falk", "cyclist, maps, and mountains"),
    ("Omar Haddad", "desert light, old cameras"),
    ("Cleo Marsh", "poetry between photos"),
    ("Theo Brandt", "woodwork and warm tones"),
    ("Suki Rao", "night markets and neon"),
    ("Bo Nielsen", "sailing the baltic slowly"),
    ("Isla Quinn", "tide pools and field notes"),
    ("Rafael Pinto", "futebol, film, and family"),
    ("Wren Ashby", "birds, dawn, patience"),
    ("Anouk Dupont", "paris rooftops at blue hour"),
    ("Kofi Mensah", "highlife records and portraits"),
    ("Sana Iqbal", "spice markets and slow travel"),
    ("Milo Frost", "snow, silence, and steel edges"),
    ("Greta Sol", "wildflowers, macro, meadows"),
    ("Enzo Ricci", "vespa, espresso, riviera"),
    ("Lena Ström", "nordic noir and fog"),
    ("Amara Okafor", "colour theory in the wild"),
    ("Finn Halloran", "coastlines and long walks"),
    ("Mei Lin", "lantern light and rain"),
    ("Oskar Vogel", "trains, platforms, departures"),
    ("Talia Ben-Ami", "olive groves and gold hour"),
    ("Rory Sinclair", "highlands, whisky, weather"),
]

CAPTIONS = [
    "ridge line before the storm rolled in", "morning, window, coffee",
    "grain is the texture of memory", "found this light and had to stop",
    "the sea was doing something quiet today", "nobody here but the wind",
    "concrete and shadow, my favourite pairing", "last of the summer heat",
    "a good day for slow film", "the colour of 6am",
    "salt in everything", "brutalist stairwell, midday",
    "waited an hour for this one to clear", "the market was alive tonight",
    "small rooms, big feelings", "this bloomed overnight",
    "cold water, clear head", "golden hour did the work for me",
    "old camera, new eyes", "the fog never really left",
    "somewhere between here and the horizon", "keeping this one simple",
    "warm tones for a cold week", "the city exhaling at dusk",
]

TAGS = ["photography", "film", "35mm", "travel", "architecture", "nature",
        "portrait", "street", "minimal", "goldenhour", "analog", "mono",
        "ocean", "mountains", "city", "quiet"]

# Real image source: Picsum returns a real photo for a seed at an exact size.
IMG_SHAPES = [
    (1080, 1080),  # square
    (1080, 1350),  # portrait 4:5
    (1350, 1080),  # landscape 5:4
    (1080, 1620),  # tall portrait 2:3
    (1620, 1080),  # landscape 3:2
    (1080, 1920),  # 9:16
    (1920, 1080),  # 16:9
]

# Small public sample videos with known dimensions and durations (seconds).
VIDEOS = [
    ("https://download.samplelib.com/mp4/sample-5s.mp4", 1280, 720, 5),
    ("https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4", 640, 360, 10),
    ("https://www.w3schools.com/html/mov_bbb.mp4", 320, 176, 10),
]

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(f"{status} {code}: {message}")
        self.status = status
        self.code = code
        self.message = message


def log(msg):
    print(msg, flush=True)


def api(method, path, token=None, body=None, headers=None):
    url = BASE + path
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Accept", "application/json")
    if payload is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw).get("data") if raw else None
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw)
            raise ApiError(err.code, parsed.get("code", ""), parsed.get("message", ""))
        except json.JSONDecodeError:
            raise ApiError(err.code, "", raw[:200])
    except urllib.error.URLError as err:
        raise ApiError(0, "UNREACHABLE", f"{url}: {err.reason}")


def tolerant(method, path, token=None, body=None, headers=None):
    try:
        return api(method, path, token, body, headers)
    except ApiError as err:
        if err.code in ALREADY_DONE:
            return None
        raise


def fetch_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.read()


_pg_container = None


def pg_container():
    """The Postgres container to run the verify step in.

    Honours LUVAX_PG_CONTAINER when set; otherwise auto-detects the running
    container that serves the luvax database. The compose project name (and so the
    container name) can change between environments, which would otherwise leave a
    hard-coded name pointing at a stopped container.
    """
    global _pg_container
    if _pg_container:
        return _pg_container
    if PG_CONTAINER:
        _pg_container = PG_CONTAINER
        return _pg_container
    try:
        out = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True, check=True
        ).stdout
        candidates = [n for n in out.split() if "postgres" in n.lower()]
        for name in candidates:
            probe = subprocess.run(
                ["docker", "exec", name, "psql", "-U", PG_USER, "-d", PG_DB, "-tAc", "SELECT 1"],
                capture_output=True, text=True,
            )
            if probe.returncode == 0:
                _pg_container = name
                return _pg_container
        if candidates:
            _pg_container = candidates[0]
            return _pg_container
    except Exception:
        pass
    _pg_container = "app-postgres-1"
    return _pg_container


def psql(sql):
    subprocess.run(
        ["docker", "exec", pg_container(), "psql", "-U", PG_USER, "-d", PG_DB, "-v", "ON_ERROR_STOP=1", "-c", sql],
        check=True, capture_output=True, text=True,
    )


# ---- accounts -------------------------------------------------------------

def handle_for(name):
    # ASCII-only so the derived email passes validation; accented letters are dropped.
    base = name.lower().replace(" ", ".")
    ascii_base = "".join(c for c in base if (c.isascii() and c.isalnum()) or c == ".")
    return ascii_base.strip(".") or "user"


def register(name):
    username = handle_for(name)
    try:
        api("POST", "/auth/register", body={
            "username": username, "email": f"{username}@{DOMAIN}",
            "password": PASSWORD, "displayName": name,
        })
        stats["users"] += 1
    except ApiError as err:
        if err.code not in ALREADY_DONE:
            raise
    return username


def verify_all(emails):
    # Login gates on user_credentials.email_verified, a different flag from the
    # users.is_verified badge. Flip the credential and keep the account active; the
    # badge is set too so seeded profiles read as verified.
    email_list = ",".join("'" + e + "'" for e in emails)
    ids = f"SELECT id FROM users WHERE email IN ({email_list})"
    psql(
        f"UPDATE user_credentials SET email_verified = true, email_verified_at = NOW() "
        f"WHERE user_id IN ({ids}); "
        f"UPDATE users SET is_verified = true, status = 'active' WHERE email IN ({email_list});"
    )


def login(username):
    data = api("POST", "/auth/login", body={"identifier": f"{username}@{DOMAIN}", "password": PASSWORD})
    return data["accessToken"], data["user"]["id"]


def register_reviewer():
    """Register the single review account, tolerating one that already exists."""
    try:
        api("POST", "/auth/register", body={
            "username": REVIEWER_USERNAME, "email": REVIEWER_EMAIL,
            "password": REVIEWER_PASSWORD, "displayName": REVIEWER_NAME,
        })
    except ApiError as err:
        if err.code not in ALREADY_DONE:
            raise


def login_reviewer():
    data = api("POST", "/auth/login", body={"identifier": REVIEWER_EMAIL, "password": REVIEWER_PASSWORD})
    return data["accessToken"], data["user"]["id"]


# ---- media ----------------------------------------------------------------

def upload_media(token, raw, mime, media_type, width, height, duration=None):
    """Run the three-step pre-signed upload and return the new media asset.

    The returned dict is the MediaAssetResponse; callers take `id` for a post's
    mediaIds and `cdnUrl` for an avatar or banner URL.
    """
    signed = api("POST", "/media/upload", token, {
        "mediaType": media_type, "mimeType": mime, "fileSize": len(raw),
    })
    put = urllib.request.Request(signed["uploadUrl"], data=raw, method=signed.get("method", "PUT"))
    for k, v in (signed.get("requiredHeaders") or {}).items():
        put.add_header(k, v)
    put.add_header("Content-Type", mime)
    with urllib.request.urlopen(put, timeout=TIMEOUT):
        pass
    asset = api("POST", "/media/upload-complete", token, {
        "storageKey": signed["storageKey"], "mediaType": media_type, "mimeType": mime,
        "fileSize": len(raw), "width": width, "height": height,
        "duration": duration, "blurhash": BLURHASH,
    })
    stats["media"] += 1
    return asset


def upload_image(token, seed, w, h):
    raw = fetch_bytes(f"https://picsum.photos/seed/{seed}/{w}/{h}.jpg")
    return upload_media(token, raw, "image/jpeg", "IMAGE", w, h)


def upload_avatar(token, seed):
    raw = fetch_bytes(f"https://picsum.photos/seed/{seed}/400/400.jpg")
    return upload_media(token, raw, "image/jpeg", "IMAGE", 400, 400)


def upload_video(token, choice):
    url, w, h, dur = choice
    raw = fetch_bytes(url)
    return upload_media(token, raw, "video/mp4", "VIDEO", w, h, dur)


# ---- content --------------------------------------------------------------

def caption_text():
    base = random.choice(CAPTIONS)
    tags = random.sample(TAGS, random.randint(1, 3))
    return base + " " + " ".join("#" + t for t in tags) + MARKER


def has_seed_posts(token, user_id):
    try:
        page = api("GET", f"/posts/user/{user_id}?limit=5", token)
        return any(MARKER in (p.get("caption") or "") for p in page["content"])
    except ApiError:
        return False


def create_post(token, seed_prefix, kind):
    media_ids = []
    post_type = "text"
    try:
        if kind == "image":
            w, h = random.choice(IMG_SHAPES)
            media_ids = [upload_image(token, f"{seed_prefix}-0", w, h)["id"]]
            post_type = "image"
        elif kind == "carousel":
            for i in range(random.randint(2, 4)):
                w, h = random.choice(IMG_SHAPES)
                media_ids.append(upload_image(token, f"{seed_prefix}-{i}", w, h)["id"])
            post_type = "carousel"
        elif kind == "video":
            media_ids = [upload_video(token, random.choice(VIDEOS))["id"]]
            post_type = "video"
    except (ApiError, urllib.error.URLError, urllib.error.HTTPError) as err:
        log(f"    media failed ({err}); posting as text")
        media_ids, post_type = [], "text"

    body = {"caption": caption_text(), "postType": post_type}
    if media_ids:
        body["mediaIds"] = media_ids
    post = api("POST", "/posts", token, body)
    stats["posts"] += 1
    return post["id"]


COMMENTS = [
    "this is stunning", "the light here is unreal", "saved. instantly.",
    "how did you meter this?", "the composition though", "peak grain, love it",
    "need a print of this", "where is this?", "the mood is everything",
    "criminally underrated shot", "colours are singing", "quiet and loud at once",
    "this belongs in a book", "okay this is my new wallpaper", "the framing is perfect",
    "you have such an eye", "goosebumps", "the negative space here",
]
REPLIES = ["thank you!", "means a lot 🙏", "haha appreciate it", "you're too kind",
           "shot on film, no edits", "somewhere up north", "spot metered for the highlights"]


def comment_id_counter():
    n = 0
    while True:
        n += 1
        yield n


_ck = comment_id_counter()


def add_comment(token, post_id, text, parent_id=None):
    body = {"postId": post_id, "content": text}
    if parent_id:
        body["parentId"] = parent_id
    key = f"seedrich-{post_id}-{next(_ck)}"
    return api("POST", f"/posts/{post_id}/comments", token, body, {"Idempotency-Key": key})["id"]


# ---- orchestration --------------------------------------------------------

def main():
    small = SCALE == "small"
    people = PEOPLE[: (6 if small else len(PEOPLE))]
    posts_lo, posts_hi = (2, 3) if small else (3, 7)

    log(f"Seeding {len(people)} users against {BASE} (scale={SCALE})")

    log("accounts: register")
    names = [name for name, _ in people]
    usernames = [register(name) for name in names]
    register_reviewer()
    log("accounts: verify via sql")
    verify_all([u + "@" + DOMAIN for u in usernames] + [REVIEWER_EMAIL])

    log("accounts: login")
    sessions = {}
    for name, username in zip(names, usernames):
        try:
            tok, uid = login(username)
            sessions[username] = {"name": name, "token": tok, "id": uid}
        except ApiError as err:
            log(f"  {username} cannot log in: {err}")
    if not sessions:
        log("BLOCKED: no account could log in.")
        return 1
    users = list(sessions.values())

    reviewer = None
    try:
        rtok, rid = login_reviewer()
        reviewer = {"name": REVIEWER_NAME, "token": rtok, "id": rid}
    except ApiError as err:
        log(f"  reviewer {REVIEWER_USERNAME} cannot log in: {err}")

    log("profiles: avatars + bios + a few banners")
    bios = {name: bio for name, bio in PEOPLE}
    for i, u in enumerate(users):
        try:
            # Idempotent: a user who already has an avatar keeps it, so re-runs skip
            # straight past the slow upload phase to the follow graph and engagement.
            me = api("GET", "/users/me", u["token"])
            if me and me.get("avatarUrl"):
                continue
            avatar = upload_avatar(u["token"], f"av-{u['id'][:8]}")
            patch = {"avatarUrl": avatar["cdnUrl"], "displayName": u["name"]}
            if bios.get(u["name"]):
                patch["bio"] = bios[u["name"]]
            if i % 3 == 0:
                banner = upload_image(u["token"], f"bn-{u['id'][:8]}", 1620, 1080)
                patch["bannerUrl"] = banner["cdnUrl"]
                stats["banners"] += 1
            api("PATCH", "/users/me", u["token"], patch)
            stats["avatars"] += 1
        except (ApiError, urllib.error.URLError) as err:
            log(f"  avatar/profile for {u['name']} failed: {err}")

    if reviewer:
        try:
            me = api("GET", "/users/me", reviewer["token"])
            if not (me and me.get("avatarUrl")):
                avatar = upload_avatar(reviewer["token"], f"av-{reviewer['id'][:8]}")
                api("PATCH", "/users/me", reviewer["token"], {
                    "avatarUrl": avatar["cdnUrl"], "displayName": REVIEWER_NAME,
                    "bio": "here to see everything",
                })
        except (ApiError, urllib.error.URLError) as err:
            log(f"  reviewer avatar failed: {err}")

    log("posts: real media")
    all_posts = []
    for u in users:
        if has_seed_posts(u["token"], u["id"]):
            log(f"  {u['name']} already seeded, skipping posts")
            page = api("GET", f"/posts/user/{u['id']}?limit=20", u["token"])
            all_posts += [(p["id"], u["id"]) for p in page["content"] if MARKER in (p.get("caption") or "")]
            continue
        n = random.randint(posts_lo, posts_hi)
        for j in range(n):
            roll = random.random()
            kind = ("carousel" if roll < 0.25 else "video" if roll < 0.35
                    else "text" if roll < 0.40 else "image")
            pid = create_post(u["token"], f"{u['id'][:8]}-{j}", kind)
            all_posts.append((pid, u["id"]))
        log(f"  {u['name']}: {n} posts")

    log("social: follow graph")
    for u in users:
        others = [o for o in users if o["id"] != u["id"]]
        k = min(len(others), random.randint(8, 18) if not small else 3)
        for target in random.sample(others, k):
            tolerant("POST", f"/social/follow/{target['id']}", u["token"])
            stats["follows"] += 1

    # The review account follows every seeded user, so its feed shows the whole
    # dataset. Tolerant, so re-runs are a no-op.
    reviewer_follows = 0
    if reviewer:
        for u in users:
            tolerant("POST", f"/social/follow/{u['id']}", reviewer["token"])
            reviewer_follows += 1
        log(f"  reviewer {REVIEWER_USERNAME} follows {reviewer_follows} accounts")

    log("engagement: likes, saves, comments, replies, comment-likes")
    for pid, owner_id in all_posts:
        likers = random.sample(users, min(len(users), random.randint(3, 12) if not small else 2))
        for u in likers:
            tolerant("POST", f"/posts/{pid}/like", u["token"])
            stats["post_likes"] += 1
        for u in random.sample(users, min(len(users), random.randint(0, 3))):
            tolerant("POST", f"/posts/{pid}/save", u["token"])
            stats["saves"] += 1

        commenters = random.sample(users, min(len(users), random.randint(2, 7) if not small else 2))
        thread_roots = []
        for u in commenters:
            try:
                cid = add_comment(u["token"], pid, random.choice(COMMENTS))
                stats["comments"] += 1
                thread_roots.append((cid, u["id"]))
            except ApiError:
                pass
        # replies: the post owner and others answer some threads
        for cid, cowner in thread_roots:
            if random.random() < 0.5:
                responder = next((x for x in users if x["id"] == owner_id), random.choice(users))
                try:
                    add_comment(responder["token"], pid, random.choice(REPLIES), parent_id=cid)
                    stats["replies"] += 1
                except ApiError:
                    pass
            # comment likes from people other than the author
            for u in random.sample(users, min(len(users), random.randint(0, 4))):
                if u["id"] == cowner:
                    continue
                tolerant("POST", f"/comments/{cid}/like", u["token"])
                stats["comment_likes"] += 1

    log("")
    log("Seed complete.")
    for k, v in stats.items():
        log(f"  {k:14} {v}")
    log(f"  password       {PASSWORD}")
    log(f"  sample login   {users[0]['name'].lower().replace(' ', '.')}@{DOMAIN}")

    log("")
    if reviewer:
        log("REVIEWER ACCOUNT (follows every seeded account)")
        log(f"  username   {REVIEWER_USERNAME}")
        log(f"  email      {REVIEWER_EMAIL}")
        log(f"  password   {REVIEWER_PASSWORD}")
        log(f"  follows    {reviewer_follows} accounts")
    else:
        log(f"REVIEWER ACCOUNT {REVIEWER_USERNAME} could not be logged in; see errors above.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ApiError as exc:
        print(f"\nFAILED: {exc}", file=sys.stderr)
        sys.exit(1)
