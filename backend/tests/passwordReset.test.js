// Password reset codes: strength, attempt limits, single use, request caps.
import { test, before, after } from 'node:test'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { startServer, checker } from './helpers.js'
import User from '../models/User.js'
import Otp from '../models/Otp.js'

// Capture outgoing emails instead of sending them through Gmail
const sent = []
nodemailer.createTransport = () => ({
    sendMail: async (m) => { sent.push({ to: m.to, code: m.html.match(/>\s*(\d+)\s*</)[1] }) },
})

const email = 'victim@x.mn'
const wrong = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, '0')
let h, c1, c2, otpId, resetToken

before(async () => {
    h = await startServer(5192)
    await User.create({ email, password: 'oldpass1', firstName: 'V', lastName: 'C' })
})
after(() => h.stop())

test('codes are 6 digits and stored only as a hash', async () => {
    const c = checker()
    await h.api('/api/auth/forgot-password', { method: 'POST', body: { email } })
    c1 = sent.at(-1).code
    c.check('6-digit code emailed', /^\d{6}$/.test(c1), c1)
    const doc = await Otp.findOne({ email }).lean()
    otpId = doc._id
    c.check('plain code not stored', !JSON.stringify(doc).includes(`"${c1}"`) && doc.codeHash?.length === 64)
    c.check('4-digit code rejected', (await h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: '1234' } })).status === 400)
    c.done()
})

test('only 5 guesses per code, even in parallel', async () => {
    const c = checker()
    const results = await Promise.all(Array.from({ length: 12 }, () =>
        h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: wrong(c1) } })))
    c.check('all wrong guesses rejected', results.every(r => r.status === 400))
    const attempts = (await Otp.findById(otpId)).attempts
    c.check('attempts capped at 5', attempts === 5, attempts)
    c.check('correct code dead after the limit', (await h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: c1 } })).status === 400)
    c.done()
})

test('a new code supersedes the old one', async () => {
    const c = checker()
    await h.api('/api/auth/forgot-password', { method: 'POST', body: { email } })
    c2 = sent.at(-1).code
    c.check('old code no longer valid', c1 === c2 || (await h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: c1 } })).status === 400)
    c.done()
})

test('reset works once and only once', async () => {
    const c = checker()
    const v = await h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: c2 } })
    resetToken = v.data?.resetToken
    c.check('correct code returns a reset token', v.status === 200 && resetToken)
    c.check('code cannot be verified twice', (await h.api('/api/auth/verify-otp', { method: 'POST', body: { email, code: c2 } })).status === 400)
    c.check('reset token is not a session token', (await h.api('/api/auth/me', { token: resetToken })).status === 401)
    c.check('reset succeeds', (await h.api('/api/auth/reset-password', { method: 'POST', body: { resetToken, newPassword: 'newpass1' } })).status === 200)
    c.check('reset token reuse rejected', (await h.api('/api/auth/reset-password', { method: 'POST', body: { resetToken, newPassword: 'evilpass' } })).status === 400)
    c.check('login with new password', (await h.api('/api/auth/login', { method: 'POST', body: { email, password: 'newpass1' } })).status === 200)
    c.check('reused token did not set a password', (await h.api('/api/auth/login', { method: 'POST', body: { email, password: 'evilpass' } })).status === 401)
    const legacy = jwt.sign({ email, purpose: 'reset' }, 'test-secret', { expiresIn: '15m' })
    c.check('old-style reset token rejected', (await h.api('/api/auth/reset-password', { method: 'POST', body: { resetToken: legacy, newPassword: 'evilpass' } })).status === 400)
    c.done()
})

test('at most 3 codes per email per 15 minutes, without revealing accounts', async () => {
    const c = checker()
    const before = sent.length
    for (let i = 0; i < 3; i++) await h.api('/api/auth/forgot-password', { method: 'POST', body: { email } })
    // Two codes were already issued in this window, so only one more goes out
    c.check('only one more code sent', sent.length - before === 1, sent.length - before)
    const capped = await h.api('/api/auth/forgot-password', { method: 'POST', body: { email } })
    c.check('capped request still answers 200', capped.status === 200)
    const unknown = await h.api('/api/auth/forgot-password', { method: 'POST', body: { email: 'nobody@x.mn' } })
    c.check('unknown email gets the same answer', unknown.data?.message === capped.data?.message)
    c.done()
})
