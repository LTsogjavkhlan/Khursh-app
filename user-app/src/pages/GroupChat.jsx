import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext'
import { fetchMessages, sendMessage } from '../api/chat'
import { useChatSocket } from '../hooks/useChatSocket'

// Header (64px) + bottom nav (80px) clearance baked into MainLayout's `main`
// padding — this page owns its own scroll region inside that space so the
// message list scrolls independently of the input bar and page chrome.
const CHROME_HEIGHT = 144

const formatTime = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const sameDay = d.toDateString() === today.toDateString()
    return sameDay
        ? d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleString('mn-MN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function GroupChat() {
    const { user } = useAuth()
    const { colors } = useTheme()

    const hasHoa = Boolean(user?.hoaName)

    const [messages, setMessages] = useState([])
    const [nextCursor, setNextCursor] = useState(null)
    const [loadingInitial, setLoadingInitial] = useState(true)
    const [loadingOlder, setLoadingOlder] = useState(false)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [toast, setToast] = useState(null)

    const listRef = useRef(null)
    const bottomRef = useRef(null)
    const prevScrollHeightRef = useRef(null)
    const prevCountRef = useRef(0)
    const seenIdsRef = useRef(new Set())

    const showToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 3500)
    }

    const appendMessage = useCallback((msg) => {
        const id = String(msg.id)
        if (seenIdsRef.current.has(id)) return
        seenIdsRef.current.add(id)
        setMessages(prev => [...prev, msg])
    }, [])

    // Initial history load
    useEffect(() => {
        if (!hasHoa) {
            setLoadingInitial(false)
            return
        }
        let cancelled = false
        setLoadingInitial(true)
        fetchMessages()
            .then(data => {
                if (cancelled) return
                const list = Array.isArray(data?.messages) ? data.messages : []
                seenIdsRef.current = new Set(list.map(m => String(m.id)))
                setMessages(list)
                setNextCursor(data?.nextCursor || null)
            })
            .catch(() => { if (!cancelled) showToast('Мессежүүдийг ачаалахад алдаа гарлаа') })
            .finally(() => { if (!cancelled) setLoadingInitial(false) })
        return () => { cancelled = true }
    }, [hasHoa])

    const { connected } = useChatSocket(appendMessage)

    // Auto-scroll to the newest message — but not when older messages were
    // just prepended by "load older" (that effect restores the offset instead).
    useEffect(() => {
        if (messages.length > prevCountRef.current && prevScrollHeightRef.current == null) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
        prevCountRef.current = messages.length
    }, [messages])

    useLayoutEffect(() => {
        if (prevScrollHeightRef.current != null && listRef.current) {
            const el = listRef.current
            el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
            prevScrollHeightRef.current = null
        }
    }, [messages])

    const loadOlder = async () => {
        if (!nextCursor || loadingOlder) return
        setLoadingOlder(true)
        prevScrollHeightRef.current = listRef.current?.scrollHeight ?? null
        try {
            const data = await fetchMessages(nextCursor)
            const older = Array.isArray(data?.messages) ? data.messages : []
            older.forEach(m => seenIdsRef.current.add(String(m.id)))
            setMessages(prev => [...older, ...prev])
            setNextCursor(data?.nextCursor || null)
        } catch {
            prevScrollHeightRef.current = null
            showToast('Хуучин мессежүүдийг ачаалахад алдаа гарлаа')
        } finally {
            setLoadingOlder(false)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        const content = input.trim()
        if (!content || sending) return
        setSending(true)
        try {
            const dto = await sendMessage(content)
            appendMessage(dto)
            setInput('')
        } catch (err) {
            showToast(err.message || 'Мессеж илгээхэд алдаа гарлаа')
        } finally {
            setSending(false)
        }
    }

    const styles = {
        page: {
            display: 'flex',
            flexDirection: 'column',
            height: `calc(100vh - ${CHROME_HEIGHT}px)`,
            margin: '0 -16px',
        },
        header: {
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
        },
        title: { fontSize: '20px', fontWeight: 'bold', color: colors.text, margin: 0 },
        status: { fontSize: '12px', color: connected ? '#16a34a' : colors.textMuted },
        list: {
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        loadOlderBtn: {
            alignSelf: 'center',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: '500',
            color: colors.accent,
            backgroundColor: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            cursor: 'pointer',
            marginBottom: '4px',
        },
        centered: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: '14px',
            padding: '0 24px',
        },
        bubbleRow: (mine) => ({
            display: 'flex',
            justifyContent: mine ? 'flex-end' : 'flex-start',
        }),
        bubble: (mine) => ({
            maxWidth: '78%',
            padding: '10px 14px',
            borderRadius: '16px',
            borderBottomRightRadius: mine ? '4px' : '16px',
            borderBottomLeftRadius: mine ? '16px' : '4px',
            backgroundColor: mine ? colors.accent : colors.surfaceAlt,
            color: mine ? '#ffffff' : colors.text,
        }),
        senderName: {
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '3px',
            color: colors.accentText,
        },
        content: { fontSize: '15px', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
        timestamp: (mine) => ({
            fontSize: '10px',
            marginTop: '4px',
            textAlign: 'right',
            color: mine ? 'rgba(255,255,255,0.75)' : colors.textMuted,
        }),
        inputBar: {
            display: 'flex',
            gap: '8px',
            padding: '10px 16px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
        },
        input: {
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceAlt,
            color: colors.text,
            fontSize: '15px',
            outline: 'none',
        },
        sendButton: {
            padding: '0 18px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: colors.accent,
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
        },
        sendButtonDisabled: { backgroundColor: '#93C5FD', cursor: 'not-allowed' },
        toast: {
            position: 'fixed',
            bottom: '88px',
            left: '16px',
            right: '16px',
            zIndex: 9999,
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            backgroundColor: '#991b1b',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
        },
    }

    if (!hasHoa) {
        return (
            <div style={styles.page}>
                <div style={styles.header}><h1 style={styles.title}>Чат</h1></div>
                <div style={styles.centered}>
                    Та одоогоор ямар нэгэн СӨХ-д харьяалагдахгүй байна. Чатыг ашиглахын тулд эхлээд СӨХ-д гишүүнээр элсэнэ үү.
                </div>
            </div>
        )
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Чат</h1>
                <span style={styles.status}>{connected ? 'Холбогдсон' : 'Холбогдож байна...'}</span>
            </div>

            <div ref={listRef} style={styles.list}>
                {nextCursor && (
                    <button type="button" onClick={loadOlder} disabled={loadingOlder} style={styles.loadOlderBtn}>
                        {loadingOlder ? 'Ачаалж байна...' : 'Хуучин мессежүүдийг харах'}
                    </button>
                )}

                {loadingInitial ? (
                    <div style={styles.centered}>Ачаалж байна...</div>
                ) : messages.length === 0 ? (
                    <div style={styles.centered}>Мессеж алга байна. Эхний мессежээ бичээрэй!</div>
                ) : (
                    messages.map(msg => {
                        // AuthContext's `user` starts out with `.id` (from the login/register
                        // response), but a later `/api/auth/me` refresh replaces it with the raw
                        // Mongo document, which only serializes `._id` (no `id` virtual) — so both
                        // are checked here to reliably identify the current user's own messages.
                        const myId = user?.id ?? user?._id
                        const mine = myId != null && String(msg.sender?.id) === String(myId)
                        const senderName = `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'Хэрэглэгч'
                        return (
                            <div key={msg.id} style={styles.bubbleRow(mine)}>
                                <div style={styles.bubble(mine)}>
                                    {!mine && <div style={styles.senderName}>{senderName}</div>}
                                    <div style={styles.content}>{msg.content}</div>
                                    <div style={styles.timestamp(mine)}>{formatTime(msg.createdAt)}</div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={styles.inputBar}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Мессеж бичих..."
                    style={styles.input}
                    maxLength={2000}
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    style={{ ...styles.sendButton, ...((sending || !input.trim()) ? styles.sendButtonDisabled : {}) }}
                >
                    Илгээх
                </button>
            </form>

            {toast && <div style={styles.toast}>{toast}</div>}
        </div>
    )
}
