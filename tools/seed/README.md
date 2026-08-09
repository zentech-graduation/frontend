# Seed

Creates demo data for a local Luvax environment through the public HTTP API only.

Full documentation, including what it creates and what it cannot create, is in
`docs/reconnaissance/seed-data.md`.

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
