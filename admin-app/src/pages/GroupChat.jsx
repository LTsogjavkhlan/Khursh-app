import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMessages, sendMessage } from '../api/chat'
import { useChatSocket } from '../hooks/useChatSocket'
import { useToast } from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

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
                <EmptyState title="Та одоогоор ямар нэгэн СӨХ-д харьяалагдахгүй байна. Чатыг ашиглахын тулд эхлээд СӨХ-д гишүүнээр элсэнэ үү." />
            </div>
        )
    }

    return (
        <div className="max-w-3xl h-[75vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-baseline justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <h1 className="text-lg font-bold text-slate-900">Чат</h1>
                <span className={`text-xs font-medium flex items-center gap-1.5 ${connected ? 'text-green-600' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {connected ? 'Холбогдсон' : 'Холбогдож байна...'}
                </span>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
                {nextCursor && (
                    <button
                        type="button"
                        onClick={loadOlder}
                        disabled={loadingOlder}
                        className="self-center mb-2 text-xs font-medium text-blue-600 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 hover:bg-slate-100 transition-colors duration-150 disabled:opacity-50"
                    >
                        {loadingOlder ? 'Ачаалж байна...' : 'Хуучин мессежүүдийг харах'}
                    </button>
                )}

                {loadingInitial ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Ачаалж байна...</div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center text-sm text-slate-400 px-6">
                        Мессеж алга байна. Эхний мессежээ бичээрэй!
                    </div>
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
                            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
                                    mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                }`}>
                                    {!mine && <p className="text-xs font-semibold text-blue-600 mb-0.5">{senderName}</p>}
                                    <p className="text-sm leading-snug whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${mine ? 'text-blue-100' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Мессеж бичих..."
                    maxLength={2000}
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                    Илгээх
                </Button>
            </form>
        </div>
    )
}
