// Minimal structured JSON logger. Outputs one JSON object per line so
// Render/Railway/Docker log collectors can parse fields without extra deps.

const isProd = process.env.NODE_ENV === 'production'

const write = (level, msg, meta = {}) => {
    const entry = {
        level,
        msg,
        time: new Date().toISOString(),
        ...meta,
    }
    const line = JSON.stringify(entry)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
}

export const logger = {
    info:  (msg, meta) => write('info', msg, meta),
    warn:  (msg, meta) => write('warn', msg, meta),
    error: (msg, meta) => write('error', msg, meta),
    // Pretty-ish for local dev: still JSON, just always on.
    debug: (msg, meta) => { if (!isProd) write('debug', msg, meta) },
}
