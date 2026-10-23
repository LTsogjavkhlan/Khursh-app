import { formatMoney } from '../../utils/format'
import { sectionMeta, sectionTitle, periodLabel, fullDay, fileSize } from '../../utils/reports'
import { CalendarRange, FileText, Paperclip, CheckCircle2, Circle } from 'lucide-react'

const HERO_BG = 'radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.10), transparent 55%), linear-gradient(165deg, #1E4740 0%, #183B35 55%, #0F2A25 100%)'

// Admin-side mirror of the resident app's ReportView: shows a report exactly
// as residents will see it (empty sections are hidden there too).
export default function ReportPreview({ report }) {
  const period = periodLabel(report.periodStart, report.periodEnd)
  const sections = (report.sections || []).filter(s => s.body?.trim() || s.items?.length)
  const attachments = report.attachments || []
  const { income, expense, net } = report.totals || {}
  const share = income && expense != null ? Math.min(100, Math.round((expense / income) * 100)) : null
  const hasMoney = income != null || expense != null
  const card = 'rounded-card border border-line bg-surface p-4'

  return (
    <div className="space-y-3 bg-canvas -m-5 p-4 sm:p-5">
      <div className="rounded-[20px] p-5 text-white" style={{ background: HERO_BG }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Ил тод байдал · Тайлан</p>
        <p className="mt-1.5 text-xl font-semibold leading-snug">{report.title || 'Гарчиггүй тайлан'}</p>
        {period && <p className="mt-3 flex items-center gap-1.5 text-sm text-white/85"><CalendarRange className="w-4 h-4" aria-hidden="true" />Тайлант хугацаа: {period}</p>}
        <p className="mt-1 text-xs text-white/60">Нийтэлсэн: {fullDay(report.publishedAt || new Date())}</p>
      </div>

      {report.summary && <p className="whitespace-pre-wrap px-1 text-[15px] leading-relaxed text-ink-secondary">{report.summary}</p>}

      {hasMoney && (
        <div className={card}>
          <p className="text-[15px] font-semibold text-ink">Санхүүгийн тойм</p>
          <dl className="mt-3">
            {income != null && (
              <div className="flex items-center justify-between gap-3 py-2 text-[15px]">
                <dt className="flex items-center gap-2 text-ink-secondary"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] bg-success-text" />Орлого</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatMoney(income)}</dd>
              </div>
            )}
            {expense != null && (
              <div className="flex items-center justify-between gap-3 py-2 text-[15px]">
                <dt className="flex items-center gap-2 text-ink-secondary"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] bg-warning-text/80" />Зарлага</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatMoney(expense)}</dd>
              </div>
            )}
            {net != null && (
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-line py-2 text-[15px]">
                <dt className="font-semibold text-ink">{net >= 0 ? 'Үлдэгдэл' : 'Алдагдал'}</dt>
                <dd className={`font-semibold tabular-nums ${net >= 0 ? 'text-success-text' : 'text-danger-text'}`}>{net < 0 ? '−' : ''}{formatMoney(Math.abs(net))}</dd>
              </div>
            )}
          </dl>
          {share != null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-ink-muted"><span>Зарцуулалт</span><span className="font-semibold text-ink-secondary tabular-nums">Орлогын {share}%</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-success-bg"><div className="h-full rounded-full bg-warning-text/80" style={{ width: `${share}%` }} /></div>
            </div>
          )}
        </div>
      )}

      {sections.map((s, i) => {
        const meta = sectionMeta(s.kind)
        const Icon = meta.icon
        return (
          <div key={i} className={card}>
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.tint}`}><Icon className="w-[18px] h-[18px]" aria-hidden="true" /></span>
              <p className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{sectionTitle(s)}</p>
              {meta.money && s.total != null && <span className="text-[15px] font-semibold tabular-nums text-ink">{formatMoney(s.total)}</span>}
            </div>
            {s.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{s.body}</p>}
            {s.items?.length > 0 && (meta.money ? (
              <ul className="mt-3 divide-y divide-line">
                {s.items.map((it, j) => (
                  <li key={j} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0"><span className="block text-sm text-ink">{it.label}</span>{it.note && <span className="block text-xs text-ink-muted">{it.note}</span>}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{typeof it.amount === 'number' ? formatMoney(it.amount) : '—'}</span>
                    </div>
                    {s.kind === 'expense' && s.total > 0 && typeof it.amount === 'number' && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-warning-text/60" style={{ width: `${Math.max(2, Math.round((it.amount / s.total) * 100))}%` }} /></div>
                    )}
                  </li>
                ))}
                {s.total != null && s.items.length > 1 && (
                  <li className="flex justify-between pt-2.5 text-sm font-semibold text-ink"><span>Нийт</span><span className="tabular-nums">{formatMoney(s.total)}</span></li>
                )}
              </ul>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {s.items.map((it, j) => {
                  const Mark = s.kind === 'work' ? CheckCircle2 : Circle
                  return (
                    <li key={j} className="flex items-start gap-2.5">
                      <Mark className={`mt-0.5 w-4 h-4 shrink-0 ${s.kind === 'work' ? 'text-success-text' : 'text-ink-muted'}`} aria-hidden="true" />
                      <span className="min-w-0"><span className="block text-sm text-ink">{it.label}</span>{it.note && <span className="block text-xs text-ink-muted">{it.note}</span>}</span>
                    </li>
                  )
                })}
              </ul>
            ))}
          </div>
        )
      })}

      {attachments.length > 0 && (
        <div className={card}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-surface-muted text-ink-secondary flex items-center justify-center"><Paperclip className="w-[18px] h-[18px]" aria-hidden="true" /></span>
            <p className="text-[15px] font-semibold text-ink">Хавсралт, баримт</p>
          </div>
          {attachments.some(a => a.kind === 'image') && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {attachments.filter(a => a.kind === 'image').map(a => (
                <img key={a._id} src={a.thumbUrl || a.url} alt="" className="aspect-square w-full rounded-control border border-line object-cover" />
              ))}
            </div>
          )}
          {attachments.filter(a => a.kind !== 'image').map(a => (
            <div key={a._id} className="mt-2 flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
              <span className="w-9 h-9 rounded-[8px] bg-danger-bg text-danger-text flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px]" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{a.name || 'Баримт'}</span><span className="block text-xs text-ink-muted">PDF{a.size ? ` · ${fileSize(a.size)}` : ''}</span></span>
            </div>
          ))}
        </div>
      )}

      {!report.summary && sections.length === 0 && attachments.length === 0 && (
        <p className="rounded-card border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">Тайланд агуулга нэмээгүй байна.</p>
      )}
    </div>
  )
}
