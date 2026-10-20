// Shared harness for the end-to-end tests: boots the real server against an
// in-memory MongoDB and exposes a small HTTP client.
//
// Each test file runs in its own process (node --test), so each one starts its
// own server on its own port.
import assert from 'node:assert/strict'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { io as ioClient } from 'socket.io-client'

export async function startServer(port) {
    // Never read the developer's real backend/.env (real database, secrets)
    process.env.DOTENV_CONFIG_PATH = '/nonexistent/.env'

    // Keep test output readable: mute the server's info/warn logs, keep errors
    console.log = () => {}
    console.warn = () => {}

    const mongo = await MongoMemoryServer.create()
    Object.assign(process.env, {
        MONGO_URI: mongo.getUri(),
        JWT_SECRET: 'test-secret',
        PORT: String(port),
        NODE_ENV: 'production',
        QPAY_CLIENT_ID: '',
        QPAY_CLIENT_SECRET: '',
    })

    const { server, io } = await import('../server.js')
    while (mongoose.connection.readyState !== 1) {
        await new Promise(r => setTimeout(r, 50))
    }

    const base = `http://127.0.0.1:${port}`

    // A fresh client IP per request (the app trusts one proxy hop), so the
    // per-IP auth limiter doesn't mask the per-account protections under test —
    // and so tests model an attacker spread across many IPs.
    let ipN = 0
    const api = async (path, { token, method = 'GET', body } = {}) => {
        ipN++
        const r = await fetch(base + path, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': `10.${port % 250}.${Math.floor(ipN / 250)}.${ipN % 250}`,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        })
        return { status: r.status, data: await r.json().catch(() => null) }
    }

    // Multipart POST: `fields` are text fields, `files` are { name, type, bytes }
    // sent under the same multipart field name (default `images`).
    const upload = async (path, { token, fields = {}, files = [], fileField = 'images' } = {}) => {
        ipN++
        const form = new FormData()
        Object.entries(fields).forEach(([k, v]) => form.append(k, v))
        files.forEach(f => form.append(fileField, new Blob([f.bytes], { type: f.type }), f.name))
        const r = await fetch(base + path, {
            method: 'POST',
            headers: {
                'X-Forwarded-For': `10.${port % 250}.${Math.floor(ipN / 250)}.${ipN % 250}`,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: form,
        })
        return { status: r.status, data: await r.json().catch(() => null) }
    }

    // Resolves to 'connected' or 'rejected: <reason>'
    const socketResult = (token) => new Promise(resolve => {
        const s = ioClient(base, { auth: { token }, transports: ['websocket'], reconnection: false })
        s.on('connect', () => { s.close(); resolve('connected') })
        s.on('connect_error', (e) => { s.close(); resolve('rejected: ' + e.message) })
    })

    const login = async (email, password = 'secret123') =>
        (await api('/api/auth/login', { method: 'POST', body: { email, password } })).data?.token

    const register = async (email, extra = {}) =>
        (await api('/api/auth/register', {
            method: 'POST',
            body: { email, password: 'secret123', firstName: 'F', lastName: 'L', ...extra },
        })).data?.token

    const stop = async () => {
        io.close()
        server.close()
        await mongoose.disconnect()
        await mongo.stop()
    }

    return { api, upload, socketResult, login, register, stop }
}

// Collects many named checks in one scenario and reports every failure at the
// end, instead of stopping at the first one.
export function checker() {
    const failures = []
    return {
        check(name, cond, detail = '') {
            if (!cond) failures.push(detail === '' ? name : `${name} (${typeof detail === 'string' ? detail : JSON.stringify(detail)})`)
        },
        done() {
            assert.deepEqual(failures, [], `Failed checks:\n  - ${failures.join('\n  - ')}`)
        },
    }
}
