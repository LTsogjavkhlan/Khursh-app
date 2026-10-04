import rateLimit from 'express-rate-limit'

// Blanket guard against abuse/DoS across the whole API. Generous enough for
// normal app usage (page loads, 60s notification polling, multiple tabs).
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,                // ~66 req/min per IP sustained
    standardHeaders: true,    // RateLimit-* headers
    legacyHeaders: false,
    message: { message: 'Хэт олон хүсэлт илгээгдлээ. Түр хүлээгээд дахин оролдоно уу.' },
})

// Strict limiter for sensitive auth endpoints (login/register/OTP) to slow down
// brute-force and credential-stuffing attempts. Successful requests still count.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Хэт олон оролдлого. 15 минутын дараа дахин оролдоно уу.' },
})
