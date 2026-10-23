import Card from './ui/Card'
import { FOCUS_RING } from './ui/Button'
import { money, fullDate } from '../utils/format'
import { sectionMeta, sectionTitle, periodLabel, fileSize } from '../utils/reports'
import { CalendarRange, FileText, ExternalLink, Paperclip, CheckCircle2, Circle } from 'lucide-react'

const HERO_BG = 'radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.10), transparent 55%), linear-gradient(165deg, #1E4740 0%, #183B35 55%, #0F2A25 100%)'

const sectionId = (i) => `report-section-${i}`

// Statement-style rows: full amounts always fit, however large. Also used by
// the homepage preview card.
export function MoneyRows({ totals, className = '', compact = false }) {
    const { income, expense, net } = totals
    const row = compact ? 'py-1.5 text-sm' : 'py-2 text-[15px]'
    return (
        <dl className={className}>
            {income != null && (
                <div className={`flex items-center justify-between gap-3 ${row}`}>
                    <dt className="flex items-center gap-2 text-ink-secondary"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] bg-success-text" />Орлого</dt>
                    <dd className="font-semibold tabular-nums text-ink">{money(income)}</dd>
                </div>
            )}
            {expense != null && (
                <div className={`flex items-center justify-between gap-3 ${row}`}>
                    <dt className="flex items-center gap-2 text-ink-secondary"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] bg-warning-text/80" />Зарлага</dt>
                    <dd className="font-semibold tabular-nums text-ink">{money(expense)}</dd>
                </div>
            )}
            {net != null && (
                <div className={`mt-1 flex items-center justify-between gap-3 border-t border-line ${row}`}>
                    <dt className="font-semibold text-ink">{net >= 0 ? 'Үлдэгдэл' : 'Алдагдал'}</dt>
                    <dd className={`font-semibold tabular-nums ${net >= 0 ? 'text-success-text' : 'text-danger-text'}`}>{net < 0 ? '−' : ''}{money(Math.abs(net))}</dd>
                </div>
            )}
        </dl>
    )
}

// Income vs. expense at a glance. Only rendered when the report has figures.
function MoneyOverview({ totals }) {
    const { income, expense } = totals
    const share = income && expense != null ? Math.min(100, Math.round((expense / income) * 100)) : null
    return (
        <Card>
            <h3 className="text-[15px] font-semibold text-ink">Санхүүгийн тойм</h3>
            <MoneyRows totals={totals} className="mt-3" />
            {share != null && (
                <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs text-ink-muted">
                        <span>Зарцуулалт</span>
                        <span className="font-semibold tabular-nums text-ink-secondary">Орлогын {share}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-success-bg" role="img" aria-label={`Орлогын ${share} хувийг зарцуулсан`}>
                        <div className="h-full rounded-full bg-warning-text/80" style={{ width: `${share}%` }} />
                    </div>
                </div>
            )}
        </Card>
    )
}

function Section({ section, index }) {
    const meta = sectionMeta(section.kind)
    const Icon = meta.icon
    const items = section.items || []
    const showShare = section.kind === 'expense' && section.total > 0

    return (
        <Card as="section" id={sectionId(index)} aria-labelledby={`${sectionId(index)}-title`} className="scroll-mt-24">
            <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                    <Icon size={19} aria-hidden="true" />
                </span>
                <h3 id={`${sectionId(index)}-title`} className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{sectionTitle(section)}</h3>
                {meta.money && section.total != null && (
                    <span className="shrink-0 text-[15px] font-semibold tabular-nums text-ink">{money(section.total)}</span>
                )}
            </div>

            {section.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{section.body}</p>}

            {items.length > 0 && (meta.money ? (
                <ul className="mt-3 divide-y divide-line">
                    {items.map((it, i) => (
                        <li key={i} className="py-2.5">
                            <div className="flex items-start justify-between gap-3">
                                <span className="min-w-0">
                                    <span className="block text-sm text-ink">{it.label}</span>
                                    {it.note && <span className="block text-xs text-ink-muted">{it.note}</span>}
                                </span>
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{typeof it.amount === 'number' ? money(it.amount) : '—'}</span>
                            </div>
                            {showShare && typeof it.amount === 'number' && (
                                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                                    <div className="h-full rounded-full bg-warning-text/60" style={{ width: `${Math.max(2, Math.round((it.amount / section.total) * 100))}%` }} />
                                </div>
                            )}
                        </li>
                    ))}
                    {section.total != null && items.length > 1 && (
                        <li className="flex items-center justify-between pt-2.5 text-sm font-semibold text-ink">
                            <span>Нийт</span>
                            <span className="tabular-nums">{money(section.total)}</span>
                        </li>
                    )}
                </ul>
            ) : (
                <ul className="mt-3 space-y-2.5">
                    {items.map((it, i) => {
                        const Mark = section.kind === 'work' ? CheckCircle2 : Circle
                        return (
                            <li key={i} className="flex items-start gap-2.5">
                                <Mark size={17} className={`mt-0.5 shrink-0 ${section.kind === 'work' ? 'text-success-text' : 'text-ink-muted'}`} aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className="block text-sm text-ink">{it.label}</span>
                                    {it.note && <span className="block text-xs text-ink-muted">{it.note}</span>}
                                    {typeof it.amount === 'number' && <span className="block text-xs font-semibold tabular-nums text-ink-secondary">{money(it.amount)}</span>}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            ))}
        </Card>
    )
}

function Attachments({ items }) {
    const images = items.filter(a => a.kind === 'image')
    const files = items.filter(a => a.kind !== 'image')
    return (
        <Card as="section" id="report-attachments" aria-labelledby="report-attachments-title" className="scroll-mt-24">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
                    <Paperclip size={19} aria-hidden="true" />
                </span>
                <h3 id="report-attachments-title" className="text-[15px] font-semibold text-ink">Хавсралт, баримт</h3>
            </div>
            {images.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                    {images.map(img => (
                        <li key={img._id || img.url}>
                            <a href={img.url} target="_blank" rel="noopener noreferrer" className={`block overflow-hidden rounded-control border border-line ${FOCUS_RING}`} aria-label={`${img.name || 'Зураг'} — томоор харах`}>
                                <img src={img.thumbUrl || img.url} alt="" loading="lazy" width={120} height={120} className="aspect-square w-full object-cover" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
            {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map(f => (
                        <li key={f._id || f.url}>
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 rounded-control border border-line px-3 py-2.5 transition-colors hover:bg-surface-muted ${FOCUS_RING}`}>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-danger-bg text-danger-text">
                                    <FileText size={18} aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-ink">{f.name || 'Баримт'}</span>
                                    <span className="block text-xs text-ink-muted">PDF{f.size ? ` · ${fileSize(f.size)}` : ''}</span>
                                </span>
                                <ExternalLink size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

// Full transparency report. Shared by the resident report page (and mirrored
// by the admin preview) so both render the same data the same way.
export default function ReportView({ report, headingLevel = 1 }) {
    const Heading = `h${headingLevel}`
    const period = periodLabel(report.periodStart, report.periodEnd)
    const sections = (report.sections || []).filter(s => s.body?.trim() || s.items?.length)
    const attachments = report.attachments || []
    const totals = report.totals || {}
    const hasMoney = totals.income != null || totals.expense != null
    const jumpLinks = [
        ...sections.map((s, i) => ({ href: `#${sectionId(i)}`, label: sectionTitle(s) })),
        ...(attachments.length ? [{ href: '#report-attachments', label: 'Хавсралт' }] : []),
    ]

    return (
        <article className="space-y-4" aria-labelledby="report-title">
            <header className="rounded-[24px] p-5 text-white" style={{ background: HERO_BG }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Ил тод байдал · Тайлан</p>
                <Heading id="report-title" className="mt-1.5 text-xl font-semibold leading-snug text-balance">{report.title}</Heading>
                {period && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-white/85">
                        <CalendarRange size={16} className="shrink-0" aria-hidden="true" />
                        <span>Тайлант хугацаа: {period}</span>
                    </p>
                )}
                {report.publishedAt && (
                    <p className="mt-1 text-xs text-white/60">
                        Нийтэлсэн: <time dateTime={report.publishedAt}>{fullDate(report.publishedAt)}</time>
                    </p>
                )}
            </header>

            {report.summary && <p className="whitespace-pre-wrap px-1 text-[15px] leading-relaxed text-ink-secondary">{report.summary}</p>}

            {/* Jump to a section in long reports */}
            {jumpLinks.length >= 3 && (
                <nav aria-label="Тайлангийн хэсгүүд" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <ul className="flex gap-2">
                        {jumpLinks.map(l => (
                            <li key={l.href} className="shrink-0">
                                <a href={l.href} className={`inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink-secondary transition-colors hover:bg-surface-muted ${FOCUS_RING}`}>
                                    {l.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            {hasMoney && <MoneyOverview totals={totals} />}

            {sections.map((s, i) => <Section key={s._id || i} section={s} index={i} />)}

            {attachments.length > 0 && <Attachments items={attachments} />}
        </article>
    )
}
