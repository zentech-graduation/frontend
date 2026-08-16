# Seed

Creates demo data for a local Luvax environment through the public HTTP API only.

Full documentation, including what it creates and what it cannot create, is in
`docs/reconnaissance/seed-data.md`.

Two scripts live here:

- `seed.py` - a small, fixed contract-checking graph (four text-only accounts). Documented below.
- `seed_rich.py` - a large, curated dataset with real media. Documented in the next section.

## seed_rich.py - large real-media dataset

Seeds around 40 curated users with real avatars, banners, and around 200 posts carrying real
images, carousels, and videos, plus a dense graph of follows, likes, saves, comments, replies, and
comment-likes. Every image is fetched from Picsum and every video from a public sample host, then
uploaded through the same pre-signed R2 flow the app uses, so the CDN URLs render rather than 404.

```bash
python tools/seed/seed_rich.py                 # full: ~40 users, ~200 posts
LUVAX_SEED_SCALE=small python tools/seed/seed_rich.py   # ~6 users, a quick check
```

It verifies each new account automatically over `docker exec` (flipping
`user_credentials.email_verified`), so there is no manual step. It is idempotent: existing accounts
are reused and a user who already has its marker posts is skipped, so a second run does not
re-upload their media. Every seeded account uses `LUVAX_SEED_PASSWORD` (default `Password123!`).

| Variable | Default | Purpose |
|----------|---------|---------|
| `LUVAX_SEED_SCALE` | `full` | `full` or `small` |
| `LUVAX_PG_CONTAINER` | `backend-postgres-1` | Postgres container for the verify step |
| `LUVAX_PG_USER` / `LUVAX_PG_DB` | `luvax` / `luvax` | Postgres role and database |

Requires the docker CLI (for the verify step) and outbound network access (to fetch media).

## seed.py - contract-checking graph

## Prerequisites

Python 3, standard library only.
Both applications already running.

## Run it from the host

```bash
python tools/seed/seed.py
```

## Run it in a container

There is no backend container in `backend/docker-compose.yaml`, so this attaches a throwaway
Python container to the compose network and reaches the host-run API.

```bash
MSYS_NO_PATHCONV=1 docker run --rm \
  --network backend_default \
  --add-host=host.docker.internal:host-gateway \
  -e LUVAX_API_BASE_URL=http://host.docker.internal:8080/api/v1 \
  -v "$(pwd)/tools/seed:/seed:ro" \
  python:3.12-alpine python /seed/seed.py
```

`MSYS_NO_PATHCONV=1` is only needed under Git Bash on Windows.

## Configuration

| Variable | Default |
|----------|---------|
| `LUVAX_API_BASE_URL` | `http://localhost:8080/api/v1` |
| `LUVAX_SEED_PASSWORD` | `ReconPass123!` |
| `LUVAX_SEED_DOMAIN` | `example.com` |

## Idempotency

Safe to run repeatedly.
Duplicate accounts, follows, blocks, likes, saves, and reports are tolerated by their 409 codes;
comments use the `Idempotency-Key` header; posts are matched by a `[luvax-seed]` caption marker.

## One manual step

Accounts cannot log in until their email is verified, and verification cannot be completed through
the HTTP API locally.
The script stops and reports this on a first run.
Run the following once, then run the script again:

```bash
docker exec backend-postgres-1 psql -U luvax -d luvax -c \
  "UPDATE user_credentials SET email_verified = true, email_verified_at = NOW()
   WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'luvax\_%')
     AND email_verified = false;"
```
