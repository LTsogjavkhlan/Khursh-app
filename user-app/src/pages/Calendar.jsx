import { useState, useEffect, useMemo } from 'react'
import { apiRequest } from '../api/client'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonBlock } from '../components/ui/Skeleton'
import { FOCUS_RING } from '../components/ui/Button'
import { dayLabel } from '../utils/format'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Trash2, AlertCircle } from 'lucide-react'

const WEEKDAYS = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня']
const WEEKDAYS_LONG = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

// Recurring weekly garbage pickup (Wednesday mornings)
const GARBAGE = { title: 'Хог ачих өдөр', time: 'Өглөө', recurring: true }

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// Monday-first grid of whole weeks covering the month
function buildGrid(year, month) {
    const first = new Date(year, month, 1)
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = Math.ceil((offset + daysInMonth) / 7) * 7
    return Array.from({ length: cells }, (_, i) => {
        const date = new Date(year, month, i - offset + 1)
        return { date, inMonth: date.getMonth() === month }
    })
}

function EventItem({ event }) {
    const recurring = event.recurring
    return (
        <li className="flex gap-3 rounded-card border border-line bg-surface p-3.5">
            <span className={`mt-0.5 h-auto w-1 shrink-0 rounded-full ${recurring ? 'bg-warning-text/60' : 'bg-brand-text'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                    {recurring && <Trash2 size={15} className="shrink-0 text-warning-text" aria-hidden="true" />}
                    {event.title}
                </p>
                {(event.time || event.location) && (
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                        {event.time && <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden="true" />{event.time}</span>}
                        {event.location && <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{event.location}</span>}
                    </p>
                )}
                {event.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{event.description}</p>}
                {recurring && <p className="mt-1 text-xs text-ink-muted">Долоо хоног бүрийн Лхагва гараг</p>}
            </div>
        </li>
    )
}

export default function Calendar() {
    const today = useMemo(() => new Date(), [])
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const [selected, setSelected] = useState(today)
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        apiRequest('/api/events')
            .then(data => setEvents((Array.isArray(data) ? data : []).map(e => ({ ...e, date: new Date(e.date) }))))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    // Index events by day for O(1) lookup while rendering the grid
    const byDay = useMemo(() => {
        const map = new Map()
        for (const e of events) {
            const k = dayKey(e.date)
            map.set(k, [...(map.get(k) || []), e])
        }
        for (const list of map.values()) list.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
        return map
    }, [events])

    const eventsFor = (date) => {
        const list = [...(byDay.get(dayKey(date)) || [])]
        if (date.getDay() === 3) list.unshift({ ...GARBAGE, _id: 'garbage' })
        return list
    }

    const grid = buildGrid(year, month)

    const shiftMonth = (delta) => {
        const d = new Date(year, month + delta, 1)
        setMonth(d.getMonth()); setYear(d.getFullYear())
        // Keep the agenda in sync: select today when it's in view, else the 1st
        setSelected(d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() ? today : d)
    }

    const goToday = () => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelected(today) }

    const selectedEvents = eventsFor(selected)

    // Upcoming (non-recurring) events from today on, in this month view
    const upcoming = events
        .filter(e => e.date.getMonth() === month && e.date.getFullYear() === year && e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((a, b) => a.date - b.date)

    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear()

    return (
        <div className="space-y-6 pb-4 pt-2">
            <PageHeader title="Хуанли" description="СӨХ-ийн үйл явдал, хурал, цэвэрлэгээ" />

            <Card padded={false} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => shiftMonth(-1)} aria-label="Өмнөх сар"
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface-muted ${FOCUS_RING}`}>
                        <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-base font-semibold text-ink" aria-live="polite">{year} оны {month + 1}-р сар</h2>
                        {!isCurrentMonth && (
                            <button type="button" onClick={goToday} className={`mt-0.5 rounded text-xs font-semibold text-brand-text hover:underline ${FOCUS_RING}`}>
                                Өнөөдөр рүү буцах
                            </button>
                        )}
                    </div>
                    <button type="button" onClick={() => shiftMonth(1)} aria-label="Дараах сар"
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface-muted ${FOCUS_RING}`}>
                        <ChevronRight size={20} aria-hidden="true" />
                    </button>
                </div>

                <div role="grid" aria-label="Хуанли">
                    <div role="row" className="grid grid-cols-7">
                        {WEEKDAYS.map((d, i) => (
                            <span key={d} role="columnheader" className={`pb-2 text-center text-xs font-semibold ${i >= 5 ? 'text-ink-secondary' : 'text-ink-muted'}`}>{d}</span>
                        ))}
                    </div>
                    {Array.from({ length: grid.length / 7 }, (_, w) => (
                        <div role="row" key={w} className="grid grid-cols-7 gap-y-1">
                            {grid.slice(w * 7, w * 7 + 7).map(({ date, inMonth }) => {
                                const list = eventsFor(date)
                                const hasHoaEvent = list.some(e => !e.recurring)
                                const isToday = sameDay(date, today)
                                const isSelected = sameDay(date, selected)
                                const label = `${dayLabel(date)}, ${WEEKDAYS_LONG[date.getDay()]}${list.length ? `, ${list.length} үйл явдал` : ''}`
                                return (
                                    <div role="gridcell" key={dayKey(date)} aria-selected={isSelected} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => { setSelected(date); if (!inMonth) { setMonth(date.getMonth()); setYear(date.getFullYear()) } }}
                                            aria-label={label}
                                            aria-current={isToday ? 'date' : undefined}
                                            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-full text-[15px] tabular-nums transition-colors ${FOCUS_RING} ${
                                                isSelected
                                                    ? 'bg-brand font-semibold text-on-brand'
                                                    : isToday
                                                        ? 'bg-brand-soft font-semibold text-brand-text'
                                                        : inMonth ? 'text-ink hover:bg-surface-muted' : 'text-ink-muted/60 hover:bg-surface-muted'
                                            }`}
                                        >
                                            {date.getDate()}
                                            {list.length > 0 && (
                                                <span aria-hidden="true" className="absolute bottom-1 flex gap-0.5">
                                                    {hasHoaEvent && <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-on-brand' : 'bg-brand-text'}`} />}
                                                    {date.getDay() === 3 && <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-on-brand/70' : 'bg-warning-text/70'}`} />}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-text" />СӨХ-ийн үйл явдал</span>
                    <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-warning-text/70" />Хог ачих өдөр</span>
                </div>
            </Card>

            {/* Agenda for the selected day */}
            <section aria-labelledby="day-title" aria-live="polite">
                <h2 id="day-title" className="mb-3 text-[15px] font-semibold text-ink-muted">
                    {sameDay(selected, today) ? 'Өнөөдөр · ' : ''}{dayLabel(selected)}, {WEEKDAYS_LONG[selected.getDay()]}
                </h2>
                {loading ? (
                    <SkeletonBlock className="h-20 rounded-card" />
                ) : selectedEvents.length === 0 ? (
                    <p className="rounded-card border border-dashed border-line-strong/50 px-4 py-5 text-center text-sm text-ink-muted">Энэ өдөр үйл явдал алга</p>
                ) : (
                    <ul className="space-y-2.5">
                        {selectedEvents.map(e => <EventItem key={e._id} event={e} />)}
                    </ul>
                )}
            </section>

            {/* This month's HOA events */}
            <section aria-labelledby="upcoming-title">
                <h2 id="upcoming-title" className="mb-3 text-[15px] font-semibold text-ink-muted">
                    {isCurrentMonth ? 'Удахгүй болох' : `${month + 1}-р сарын үйл явдал`}
                </h2>
                {loading ? (
                    <SkeletonBlock className="h-24 rounded-card" />
                ) : error ? (
                    <Card><EmptyState tone="error" icon={AlertCircle} title="Үйл явдлыг ачаалж чадсангүй" description="Дахин оролдоно уу." className="py-4" /></Card>
                ) : upcoming.length === 0 ? (
                    <Card><EmptyState icon={CalendarDays} title="Үйл явдал алга" description="Энэ сард төлөвлөсөн үйл явдал байхгүй байна." className="py-4" /></Card>
                ) : (
                    <Card padded={false}>
                        <ul className="divide-y divide-line">
                            {upcoming.map(e => (
                                <li key={e._id}>
                                    <button type="button" onClick={() => setSelected(e.date)}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none">
                                        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-control bg-brand-soft text-brand-text">
                                            <span className="text-lg font-bold leading-none tabular-nums">{e.date.getDate()}</span>
                                            <span className="text-[10px] font-semibold">{WEEKDAYS_LONG[e.date.getDay()]}</span>
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[15px] font-semibold text-ink">{e.title}</span>
                                            <span className="block truncate text-[13px] text-ink-muted">{[e.time, e.location].filter(Boolean).join(' · ') || dayLabel(e.date)}</span>
                                        </span>
                                        <ChevronRight size={18} className="shrink-0 text-ink-muted" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </section>
        </div>
    )
}
