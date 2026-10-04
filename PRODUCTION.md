# Production deploy notes

Recommended split hosting:
- **User App** (`user-app/`) and **Admin App** (`admin-app/`): two separate Vercel/Netlify static sites (each is its own Vite build)
- **Backend** (`backend/`): Render / Railway / Docker on a VPS — one shared API for both frontends
- **Database**: MongoDB Atlas

## Backend env (required)

```
MONGO_URI=...
JWT_SECRET=...          # long random; never reuse the dev value
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-user-app-domain.com,https://your-admin-app-domain.com
```

`CLIENT_URL` is comma-separated — both frontend origins must be listed or the one left out will be blocked by CORS.

Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Frontend env (build-time)

Each app builds against the same API, set independently in `user-app/.env` and `admin-app/.env`:
```
VITE_API_BASE_URL=https://your-api-domain.com
```

## Health probes

- `GET /api/health` — liveness (process up)
- `GET /api/ready` — readiness (Mongo connected); use this for load balancers

## Run with Docker

```bash
cp backend/.env.example backend/.env   # fill values
docker compose up --build
```

## Manual run

```bash
cd backend && npm ci && npm start
# separately, one build per frontend:
cd user-app && npm ci && npm run build    # serve dist/ on Vercel/Netlify
cd admin-app && npm ci && npm run build   # serve dist/ on a second Vercel/Netlify site
```
