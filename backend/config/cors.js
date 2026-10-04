// Centralised, production-ready CORS configuration.
//
// Allowed browser origins are supplied via the CLIENT_URL env var
// (comma-separated for multiple), falling back to the local dev server. In
// production you MUST set CLIENT_URL to your deployed frontend origin(s).
//
// The allowlist is read from the environment lazily (at request/startup time)
// rather than cached at import time, so it is unaffected by module load order
// relative to dotenv.

export const getAllowedOrigins = () =>
    (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)

// True when the request may proceed. Non-browser clients (curl, mobile apps,
// server-to-server calls such as the QPay webhook, health checks) send no
// Origin header and are always allowed — CORS is a browser-enforced policy, so
// this does not weaken security for those callers.
export const isOriginAllowed = (origin) => {
    if (!origin) return true
    return getAllowedOrigins().includes(origin)
}

export const corsOptions = {
    origin(origin, callback) {
        // Return `false` (not an error) for disallowed origins so the browser
        // blocks the response without generating server-side 500 noise.
        callback(null, isOriginAllowed(origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Cache successful preflight responses for 24h to cut preflight traffic.
    maxAge: 86400,
    optionsSuccessStatus: 204,
}
