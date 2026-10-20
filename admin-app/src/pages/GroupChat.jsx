import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMessages, sendMessage } from '../api/chat'
import { useChatSocket } from '../hooks/useChatSocket'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button, { FOCUS_RING } from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { Users, SendHorizontal, MessagesSquare } from 'lucide-react'

// Chrome lacks Mongolian Intl data (times came out as "07:38 PM"), so build them
const pad = (n) => String(n).padStart(2, '0')
const timeOf = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
const daySeparator = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    if (sameDay(d, today)) return 'Өнөөдөр'
    if (sameDay(d, yesterday)) return 'Өчигдөр'
    return `${d.getFullYear() !== today.getFullYear() ? `${d.getFullYear()} оны ` : ''}${d.getMonth() + 1}-р сарын ${d.getDate()}`
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
            .catch(() => { if (!cancelled) toast.error('Мессежүүдийг ачаалахад алдаа гарлаа') })
            .finally(() => { if (!cancelled) setLoadingInitial(false) })
        return () => { cancelled = true }
    }, [hasHoa, toast])

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
            toast.error('Хуучин мессежүүдийг ачаалахад алдаа гарлаа')
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
            toast.error(err.message || 'Мессеж илгээхэд алдаа гарлаа')
        } finally {
            setSending(false)
        }
    }

    if (!hasHoa) {
        return (
            <div className="space-y-6 max-w-3xl">
                <PageHeader title="Чат" />
                <EmptyState icon={<MessagesSquare className="w-5 h-5" />} title="Та одоогоор ямар нэгэн СӨХ-д харьяалагдахгүй байна. Чатыг ашиглахын тулд эхлээд СӨХ-д гишүүнээр элсэнэ үү." />
            </div>
        )
    }

    // AuthContext's `user` starts out with `.id` (from the login/register
    // response), but a later `/api/auth/me` refresh replaces it with the raw
    // Mongo document, which only serializes `._id` — so check both.
    const myId = user?.id ?? user?._id

    return (
        <div className="max-w-4xl h-[calc(100dvh-10rem)] min-h-[420px] flex flex-col bg-surface border border-line rounded-card shadow-card overflow-hidden">
            <header className="flex items-center gap-3 px-5 py-3.5 border-b border-line shrink-0">
                <span className="w-10 h-10 rounded-full bg-brand text-on-brand flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-semibold text-ink">Хөршийн чат</h1>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
                        <span aria-hidden="true" className={`w-2 h-2 rounded-full ${connected ? 'bg-success-text' : 'bg-line-strong'}`} />
                        <span className="truncate">{user.hoaName} · {connected ? 'Холбогдсон' : 'Холбогдож байна…'}</span>
                    </p>
                </div>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 bg-canvas/50" role="log" aria-label="Мессежүүд">
                {nextCursor && (
                    <div className="mb-3 flex justify-center">
                        <Button variant="secondary" size="sm" className="rounded-full" onClick={loadOlder} loading={loadingOlder}>
                            {loadingOlder ? 'Ачаалж байна…' : 'Хуучин мессеж харах'}
                        </Button>
                    </div>
                )}

                {loadingInitial ? (
                    <div className="space-y-3" aria-busy="true">
                        <Skeleton.Line className="h-12 w-1/2 rounded-2xl" />
                        <Skeleton.Line className="ml-auto h-10 w-1/3 rounded-2xl" />
                        <Skeleton.Line className="h-12 w-2/5 rounded-2xl" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-sm text-ink-muted px-6">
                        <MessagesSquare className="w-6 h-6 mb-2" aria-hidden="true" />
                        Мессеж алга байна. Оршин суугчиддаа эхний мессежээ бичээрэй!
                    </div>
                ) : (
                    <ol className="flex flex-col">
                        {messages.map((msg, i) => {
                            const prev = messages[i - 1]
                            const next = messages[i + 1]
                            const newDay = !prev || !sameDay(prev.createdAt, msg.createdAt)
                            const mine = myId != null && String(msg.sender?.id) === String(myId)
                            const grouped = !newDay && String(prev.sender?.id) === String(msg.sender?.id)
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
                                            <span aria-hidden="true" className={`w-8 h-8 rounded-full bg-brand-soft text-brand-text text-[11px] font-bold flex items-center justify-center shrink-0 ${lastInGroup ? '' : 'invisible'}`}>
                                                {initialsOf(msg.sender)}
                                            </span>
                                        )}
                                        <div className={`max-w-[70%] px-3.5 py-2 rounded-[18px] ${
                                            mine ? `bg-brand text-on-brand ${lastInGroup ? 'rounded-br-md' : ''}` : `bg-surface border border-line text-ink ${lastInGroup ? 'rounded-bl-md' : ''}`
                                        }`}>
                                            {mine ? <span className="sr-only">Та: </span> : grouped
                                                ? <span className="sr-only">{senderName}: </span>
                                                : <p className="text-xs font-semibold text-brand-text mb-0.5">{senderName}</p>}
                                            <p className="text-sm leading-snug whitespace-pre-wrap break-words">{msg.content}</p>
                                            <p className={`text-[10px] mt-0.5 text-right tabular-nums ${mine ? 'text-white/70' : 'text-ink-muted'}`}>
                                                <time dateTime={msg.createdAt}>{timeOf(msg.createdAt)}</time>
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

            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-line shrink-0">
                <label htmlFor="admin-chat-input" className="sr-only">Мессеж</label>
                <input
                    id="admin-chat-input"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Мессеж бичих…"
                    autoComplete="off"
                    maxLength={2000}
                    className="flex-1 h-10 rounded-full border border-line-strong bg-surface-muted px-4 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-surface"
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Илгээх"
                    className={`w-10 h-10 shrink-0 rounded-full bg-brand text-on-brand flex items-center justify-center transition-opacity hover:bg-brand-hover disabled:opacity-40 ${FOCUS_RING}`}
                >
                    <SendHorizontal className="w-[18px] h-[18px]" aria-hidden="true" />
                </button>
            </form>
        </div>
    )
}
