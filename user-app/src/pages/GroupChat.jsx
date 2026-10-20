import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMessages, sendMessage } from '../api/chat'
import { useChatSocket } from '../hooks/useChatSocket'
import { useToast } from '../components/Toast'
import Button, { FOCUS_RING } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { dayLabel, timeLabel } from '../utils/format'
import { Users, SendHorizontal, MessagesSquare, Building2 } from 'lucide-react'

// MainLayout's `main` reserves 64px for the top bar and 104px for the floating
// nav (plus safe areas). This page owns its own scroll region inside that
// space so the message list scrolls independently of the composer.
const PAGE_HEIGHT = 'calc(100dvh - 168px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

function daySeparator(iso) {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    if (sameDay(d, today)) return 'Өнөөдөр'
    if (sameDay(d, yesterday)) return 'Өчигдөр'
    return d.getFullYear() === today.getFullYear() ? dayLabel(d) : `${d.getFullYear()} оны ${dayLabel(d)}`
}

const initialsOf = (s) => ((s?.firstName?.[0] || '') + (s?.lastName?.[0] || '')).toUpperCase() || '?'

export default function GroupChat() {
    const { user } = useAuth()
    const toast = useToast()

    const hasHoa = Boolean(user?.hoaName)

    const [messages, setMessages] = useState([])
    const [nextCursor, setNextCursor] = useState(null)
    const [loadingInitial, setLoadingInitial] = useState(true)
    const [loadingOlder, setLoadingOlder] = useState(false)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)

    const listRef = useRef(null)
    const bottomRef = useRef(null)
    const prevScrollHeightRef = useRef(null)
    const prevCountRef = useRef(0)
    const seenIdsRef = useRef(new Set())

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
            .catch(() => { if (!cancelled) toast.show('Мессежүүдийг ачаалахад алдаа гарлаа') })
            .finally(() => { if (!cancelled) setLoadingInitial(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHoa])

    const { connected } = useChatSocket(appendMessage)

    // Auto-scroll to the newest message — but not when older messages were
    // just prepended by "load older" (that effect restores the offset instead).
    useEffect(() => {
        if (messages.length > prevCountRef.current && prevScrollHeightRef.current == null) {
            const smooth = prevCountRef.current > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
            bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
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
            toast.show('Хуучин мессежүүдийг ачаалахад алдаа гарлаа')
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
            toast.show(err.message || 'Мессеж илгээхэд алдаа гарлаа')
        } finally {
            setSending(false)
        }
    }

    if (!hasHoa) {
        return (
            <div className="pt-6">
                <EmptyState
                    icon={Building2}
                    title="СӨХ-д бүртгэлгүй байна"
                    description="Хөршийн чатыг ашиглахын тулд эхлээд СӨХ-д гишүүнээр элсэнэ үү."
                    action={<Link to="/profile" className={`inline-flex h-9 items-center rounded-control bg-brand-soft px-3.5 text-sm font-semibold text-brand-text ${FOCUS_RING}`}>Профайл руу очих</Link>}
                />
            </div>
        )
    }

    // AuthContext's `user` starts out with `.id` (from the login/register
    // response), but a later `/api/auth/me` refresh replaces it with the raw
    // Mongo document, which only serializes `._id` — so check both.
    const myId = user?.id ?? user?._id

    return (
        <div className="-mx-4 flex flex-col" style={{ height: PAGE_HEIGHT }}>
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                    <Users size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h1 className="truncate text-[17px] font-semibold text-ink">Хөршийн чат</h1>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${connected ? 'bg-success-text' : 'bg-line-strong'}`} />
                        <span className="truncate">{user.hoaName} · {connected ? 'Холбогдсон' : 'Холбогдож байна…'}</span>
                    </p>
                </div>
            </header>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3" role="log" aria-label="Мессежүүд">
                {nextCursor && (
                    <div className="mb-3 flex justify-center">
                        <Button variant="secondary" size="sm" className="rounded-full" onClick={loadOlder} loading={loadingOlder}>
                            {loadingOlder ? 'Ачаалж байна…' : 'Хуучин мессеж харах'}
                        </Button>
                    </div>
                )}

                {loadingInitial ? (
                    <div className="space-y-3" aria-busy="true">
                        <SkeletonBlock className="h-14 w-2/3 rounded-2xl" />
                        <SkeletonBlock className="ml-auto h-10 w-1/2 rounded-2xl" />
                        <SkeletonBlock className="h-14 w-3/5 rounded-2xl" />
                    </div>
                ) : messages.length === 0 ? (
                    <EmptyState icon={MessagesSquare} title="Мессеж алга байна" description="Хөршүүддээ эхний мессежээ бичээрэй!" className="h-full justify-center" />
                ) : (
                    <ol className="flex flex-col">
                        {messages.map((msg, i) => {
                            const prev = messages[i - 1]
                            const newDay = !prev || !sameDay(prev.createdAt, msg.createdAt)
                            const mine = myId != null && String(msg.sender?.id) === String(myId)
                            // Group consecutive messages from the same sender on the same day
                            const grouped = !newDay && prev && String(prev.sender?.id) === String(msg.sender?.id)
                            const next = messages[i + 1]
                            const lastInGroup = !next || String(next.sender?.id) !== String(msg.sender?.id) || !sameDay(next.createdAt, msg.createdAt)
                            const senderName = `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'Хэрэглэгч'
                            return (
                                <li key={msg.id} className={grouped ? 'mt-1' : 'mt-3 first:mt-0'}>
                                    {newDay && (
                                        <p className="mb-3 flex justify-center">
                                            <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold text-ink-muted">{daySeparator(msg.createdAt)}</span>
                                        </p>
                                    )}
                                    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                        {!mine && (
                                            <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-text ${lastInGroup ? '' : 'invisible'}`}>
                                                {initialsOf(msg.sender)}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[78%] px-3.5 py-2 ${
                                                mine
                                                    ? `rounded-[18px] bg-brand text-on-brand ${lastInGroup ? 'rounded-br-md' : ''}`
                                                    : `rounded-[18px] border border-line bg-surface text-ink ${lastInGroup ? 'rounded-bl-md' : ''}`
                                            }`}
                                        >
                                            {mine ? <span className="sr-only">Та: </span> : (
                                                grouped
                                                    ? <span className="sr-only">{senderName}: </span>
                                                    : <p className="mb-0.5 text-xs font-semibold text-brand-text">{senderName}</p>
                                            )}
                                            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.content}</p>
                                            <p className={`mt-0.5 text-right text-[10px] tabular-nums ${mine ? 'text-on-brand/70' : 'text-ink-muted'}`}>
                                                <time dateTime={msg.createdAt}>{timeLabel(msg.createdAt)}</time>
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line bg-surface px-4 py-2.5">
                <label htmlFor="chat-input" className="sr-only">Мессеж</label>
                <input
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Мессеж бичих…"
                    autoComplete="off"
                    maxLength={2000}
                    enterKeyHint="send"
                    className="min-h-11 flex-1 rounded-full border border-line-strong bg-surface-muted px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-brand-text focus:outline-none focus:ring-2 focus:ring-brand-text/25"
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Илгээх"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand transition-opacity hover:bg-brand-hover disabled:opacity-40 ${FOCUS_RING}`}
                >
                    <SendHorizontal size={19} aria-hidden="true" />
                </button>
            </form>
        </div>
    )
}
