# Auto-Deploy Setup (GitHub Actions → Azure VPS)

Every push to `main` builds and restarts the Docker stack on your VPS over SSH.

## 1. Add GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `VPS_HOST` | `40.81.246.41` |
| `VPS_USER` | `azureuser` |
| `VPS_APP_DIR` | `/home/azureuser/leetcode-backend` |
| `VPS_SSH_KEY` | Full contents of `rumjot.pem` (see below) |

### Get the SSH key contents

```bash
cat /Users/rumjotsingh/Downloads/rumjot.pem
```

Copy the **entire** output including:

```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

Paste it as the value of `VPS_SSH_KEY`.

## 2. One-time server prep

SSH in:

```bash
ssh -i /Users/rumjotsingh/Downloads/rumjot.pem azureuser@40.81.246.41
```

Ensure Docker + git are installed:

```bash
docker --version && docker compose version && git --version
# If missing:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
```

Create the `.env` file on the server (NOT in git):

```bash
mkdir -p /home/azureuser/leetcode-backend
cd /home/azureuser/leetcode-backend
git clone https://github.com/rumjotsingh/leetcode-backend.git .
cp .env.example .env
nano .env   # fill in real secrets: MONGODB_URI, JWT secrets, EXECUTION_API_TOKEN, ACME_EMAIL
```

> The workflow runs `git reset --hard`, which never touches `.env` because it's gitignored. Your secrets persist across deploys.

## 3. Trigger a deploy

```bash
git push origin main
```

Or run manually: repo → **Actions → Deploy to VPS → Run workflow**.

## 4. Verify

Watch progress in the **Actions** tab, then:

```bash
ssh -i /Users/rumjotsingh/Downloads/rumjot.pem azureuser@40.81.246.41 \
  "cd /home/azureuser/leetcode-backend && docker compose ps"

curl https://leetcode.rumjot.me/health
```

## Notes

- Backend listens on **8080 internally** (not exposed) — Caddy proxies it on 80/443.
- If port 80 is taken by another app (e.g. CodeBox), those two must share one Caddy or run on separate hosts.
