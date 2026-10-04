# СӨХ (HOA) App

A homeowners-association management platform: residents and HOA/platform administrators share one backend and database, through two separate frontends.

```
backend/     Express + MongoDB API (shared by both frontends)
user-app/    React/Vite app for residents
admin-app/   React/Vite app for HOA admins and platform admins
```

## Roles

- **user** — resident. Uses `user-app` only.
- **admin** — HOA administrator, scoped to their own HOA. Uses `admin-app`.
- **platform_admin** — operates the whole system (creates HOAs, etc.), not scoped to one HOA. Uses `admin-app`, with an extra "Байгууллагууд" (Organizations) section.

The backend is always the source of truth for identity and role — both frontends read the role from the JWT the backend issues and never trust a client-supplied role for authorization.

## Running locally

Each part runs independently and they all need to be up at once for the full app to work.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev
```

Runs on `http://localhost:5000`. `CLIENT_URL` in `backend/.env` must list both frontend origins (comma-separated) so CORS allows them, e.g.:

```
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

### User App (residents)

```bash
cd user-app
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### Admin App (HOA admins / platform admins)

```bash
cd admin-app
npm install
npm run dev
```

Runs on `http://localhost:5174`.

## Creating admin accounts

There's no self-registration for admins. Create the first platform admin with the bootstrap script from `backend/`; credentials come from the environment (or `backend/.env`) so they never end up in git:

```bash
PLATFORM_ADMIN_EMAIL=you@example.com PLATFORM_ADMIN_PASSWORD='...' node scripts/createPlatformAdmin.js
```

The platform admin then creates each HOA and its first admin from the admin app's **Байгууллагууд** page. (`scripts/createAdmin.js` does the same from the command line: set `ADMIN_HOA_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.)

## Tests

```bash
cd backend
npm test
```

End-to-end tests that boot the real server against an in-memory MongoDB — no setup, and they never touch your `.env` or real database. They cover tenant isolation, membership approval, password reset, tenant invites, billing and the QPay callback. CI runs them on every push.

## Group chat

Both apps include a real-time group chat (Socket.IO), scoped per HOA — residents and their HOA's admins share the same room. See `backend/models/ChatMessage.js`, `backend/controllers/chatController.js`, and each app's `src/pages/GroupChat.jsx`.

## Production

See `PRODUCTION.md` for deployment notes (each frontend deploys as its own static site; the backend deploys separately).
