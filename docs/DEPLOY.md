# DearSafe — Deploy Guide

Two patterns. Pick based on whether the host already runs Caddy for other apps.

---

## Pattern A — Standalone host (DearSafe owns 80/443)

Simplest. Use the built-in Caddy profile.

```bash
git clone https://github.com/dmpotter1361/DearSafe.git && cd DearSafe
cp .env.example .env
# edit .env:  JWT_SECRET=<random>, DOMAIN=journal.example,
#             APP_BASE_URL=https://journal.example, COOKIE_SECURE=true
docker compose --profile https up -d --build
```

Caddy fetches a Let's Encrypt cert automatically (needs ports 80+443 reachable and DNS
pointed at the host).

---

## Pattern B — Shared server (a central Caddy fronts several apps) ✅ recommended for multi-app hosts

One Caddy proxy owns 80/443; every app runs **app-only** on a shared Docker network and just
registers a site block. Adding an app later = 3 lines + reload.

### One-time: the shared proxy

```bash
docker network create edge          # idempotent
mkdir -p ~/edge && cd ~/edge
```

`~/edge/docker-compose.yml`:
```yaml
services:
  caddy:
    image: caddy:2
    container_name: edge-caddy
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks: [edge]
networks:
  edge:
    external: true
volumes: { caddy-data: {}, caddy-config: {} }
```

`~/edge/Caddyfile` (one block per app, proxying to the app's container name):
```caddy
journal.example {
    encode zstd gzip
    reverse_proxy dearsafe-app:3600
}
# doughnotes.example { reverse_proxy doughnotes-app:3500 }
```

```bash
docker compose up -d            # start the shared proxy
```

### Each app: run app-only on the shared network

For DearSafe, create a server-only override so it joins `edge` and does **not** publish 80/443
or its own Caddy. `~/DearSafe/docker-compose.override.yml`:
```yaml
services:
  app:
    container_name: dearsafe-app
    ports: []                  # no host port; the proxy reaches it over the edge network
    networks: [edge]
networks:
  edge:
    external: true
```

```bash
cd ~/DearSafe
cp .env.example .env           # JWT_SECRET, APP_BASE_URL=https://journal.example, COOKIE_SECURE=true
docker compose up -d --build   # builds app; override puts it on edge as dearsafe-app
```

### Add the site + reload
```bash
# add the app's block to ~/edge/Caddyfile, then:
docker exec edge-caddy caddy reload --config /etc/caddy/Caddyfile
```

> The override file and the real domain are **server-specific** — keep them out of the public
> repo (the committed compose/Caddyfile stay generic with placeholders).

---

## Updating

```bash
cd ~/DearSafe && git pull && docker compose up -d --build
```
The `dearsafe-data` volume (DB + encrypted media) is preserved across updates.

## Backups

Back up the `dearsafe-data` volume regularly. The recovery card protects *access*; backups
protect *the data itself*. Both are needed.
