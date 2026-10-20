import { useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { niceMax } from '../../utils/dashboardStats'
import { formatMoney, formatCompact, formatPercent, formatMonthShort, formatMonthLong } from '../../utils/format'

const PLOT_HEIGHT = 200 // px, excluding the x-axis label band
const TICKS = 4

function LegendKey({ colorClass, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
      <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${colorClass}`} />
      {label}
    </span>
  )
}

// Billed amount per month split into collected (accent) and outstanding
// (de-emphasis grey) — an emphasis chart: the story is collection.
// Columns are focusable; hover/focus shows every value; a table view carries
// the same numbers without hovering.
export default function CollectionChart({ months }) {
  const [view, setView] = useState('chart')
  const [active, setActive] = useState(null)

  const max = niceMax(Math.max(...months.map(m => m.billed)))
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (max / TICKS) * i)
  const latest = months[months.length - 1]

  return (
    <section className="bg-surface border border-line rounded-card shadow-card p-5" aria-labelledby="collection-title">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 id="collection-title" className="text-base font-semibold text-ink">Төлбөрийн цуглуулалт</h2>
          <p className="text-xs text-ink-muted mt-0.5">Сүүлийн {months.length} сарын нэхэмжлэл: цугларсан ба үлдэгдэл</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <LegendKey colorClass="bg-chart-accent" label="Цугларсан" />
            <LegendKey colorClass="bg-chart-muted" label="Үлдэгдэл" />
          </div>
          <div className="flex rounded-[8px] border border-line p-0.5" role="group" aria-label="Харагдац">
            {[['chart', 'График', BarChart3], ['table', 'Хүснэгт', Table2]].map(([key, label, icon]) => {
              const Icon = icon
              return (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                aria-label={label}
                title={label}
                onClick={() => setView(key)}
                className={`w-8 h-7 rounded-[6px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  view === key ? 'bg-surface-muted text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </button>
              )
            })}
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Сар бүрийн нэхэмжлэл, цугларсан ба үлдэгдэл</caption>
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-line">
                <th scope="col" className="py-2 pr-4 font-medium">Сар</th>
                <th scope="col" className="py-2 px-4 font-medium text-right">Нэхэмжилсэн</th>
                <th scope="col" className="py-2 px-4 font-medium text-right">Цугларсан</th>
                <th scope="col" className="py-2 px-4 font-medium text-right">Үлдэгдэл</th>
                <th scope="col" className="py-2 pl-4 font-medium text-right">Хувь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {months.map(m => (
                <tr key={m.month}>
                  <th scope="row" className="py-2.5 pr-4 font-medium text-ink text-left">{formatMonthLong(m.month)}</th>
                  <td className="py-2.5 px-4 text-right text-ink-secondary">{formatMoney(m.billed)}</td>
                  <td className="py-2.5 px-4 text-right text-ink">{formatMoney(m.collected)}</td>
                  <td className="py-2.5 px-4 text-right text-ink-secondary">{formatMoney(m.outstanding)}</td>
                  <td className="py-2.5 pl-4 text-right text-ink">{formatPercent(m.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 flex gap-3">
          {/* Y axis */}
          <div className="relative shrink-0 w-[72px] text-right" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
            {ticks.map(t => (
              <span key={t} className="absolute right-0 text-[11px] text-ink-muted tabular-nums -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
                {formatCompact(t)}
              </span>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {/* Plot */}
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {ticks.map(t => (
                <div key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${(t / max) * 100}%` }} />
              ))}

              <ul className="absolute inset-0 flex items-end justify-around">
                {months.map((m, i) => {
                  const collectedPct = (m.collected / max) * 100
                  const outstandingPct = (m.outstanding / max) * 100
                  const isActive = active === m.month
                  const isLatest = m === latest
                  return (
                    <li key={m.month} className="relative h-full flex-1 flex justify-center">
                      <button
                        type="button"
                        className="relative h-full w-full max-w-[64px] flex flex-col justify-end items-center rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        aria-label={`${formatMonthLong(m.month)}: цугларсан ${formatMoney(m.collected)}, үлдэгдэл ${formatMoney(m.outstanding)}, ${formatPercent(m.rate)}`}
                        onPointerEnter={() => setActive(m.month)}
                        onPointerLeave={() => setActive(null)}
                        onFocus={() => setActive(m.month)}
                        onBlur={() => setActive(null)}
                      >
                        {/* Selective direct label: only the latest month */}
                        {isLatest && (
                          <span className="mb-1.5 text-xs font-semibold text-ink tabular-nums">{formatPercent(m.rate)}</span>
                        )}
                        <span className={`flex flex-col w-6 transition-[filter] ${isActive ? 'brightness-110' : ''}`}>
                          {m.outstanding > 0 && (
                            <span
                              className={`block bg-chart-muted rounded-t-[4px] ${m.collected > 0 ? 'mb-[2px]' : ''}`}
                              style={{ height: `${(outstandingPct / 100) * PLOT_HEIGHT}px` }}
                            />
                          )}
                          {m.collected > 0 && (
                            <span
                              className={`block bg-chart-accent ${m.outstanding > 0 ? '' : 'rounded-t-[4px]'}`}
                              style={{ height: `${(collectedPct / 100) * PLOT_HEIGHT}px` }}
                            />
                          )}
                        </span>
                      </button>

                      {isActive && (
                        <div
                          role="tooltip"
                          className={`pointer-events-none absolute z-10 top-1 w-48 rounded-control bg-surface border border-line shadow-pop p-3 text-left ${
                            // Beside the column, inside the plot; the last column flips left
                            i === months.length - 1 ? 'right-[calc(50%+20px)]' : 'left-[calc(50%+20px)]'
                          }`}
                        >
                          <p className="text-xs text-ink-muted mb-2">{formatMonthLong(m.month)}</p>
                          {[
                            ['bg-chart-accent', 'Цугларсан', formatMoney(m.collected)],
                            ['bg-chart-muted', 'Үлдэгдэл', formatMoney(m.outstanding)],
                          ].map(([key, label, value]) => (
                            <p key={label} className="flex items-center gap-2 text-xs py-0.5">
                              <span aria-hidden="true" className={`w-3 h-[3px] rounded-full ${key}`} />
                              <span className="font-semibold text-ink tabular-nums">{value}</span>
                              <span className="text-ink-muted ml-auto">{label}</span>
                            </p>
                          ))}
                          <p className="mt-1.5 pt-1.5 border-t border-line text-xs text-ink-secondary">
                            Төлөлт <span className="font-semibold text-ink">{formatPercent(m.rate)}</span>
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* X axis */}
            <ul className="flex justify-around mt-2" aria-hidden="true">
              {months.map(m => (
                <li key={m.month} className="flex-1 text-center text-[11px] text-ink-muted">{formatMonthShort(m.month)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
