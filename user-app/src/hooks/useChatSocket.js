import { useEffect, useRef, useState } from 'react'
import { io as ioClient } from 'socket.io-client'
import { API_BASE_URL } from '../api/client'

// Connects once (while the caller has a token) and delivers incoming chat
// messages via `onMessage`. The server derives the HOA room from the same JWT
// used for REST calls — nothing here tells it which room to join.
// Reconnection after a dropped connection is handled by socket.io-client itself.
export function useChatSocket(onMessage) {
    const [connected, setConnected] = useState(false)
    const onMessageRef = useRef(onMessage)
    onMessageRef.current = onMessage

    useEffect(() => {
        let token
        try {
            token = localStorage.getItem('authToken')
        } catch {
            token = null
        }
        if (!token) return

        const socket = ioClient(API_BASE_URL, { auth: { token } })

        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))
        socket.on('connect_error', () => setConnected(false))
        socket.on('chat:message', (message) => onMessageRef.current?.(message))

        return () => {
            socket.disconnect()
        }
    }, [])

    return { connected }
}
