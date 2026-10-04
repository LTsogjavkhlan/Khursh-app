const TONES = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-50 text-blue-600 border border-blue-200',
  slate: 'bg-slate-100 text-slate-600 border border-slate-200',
  orange: 'bg-orange-50 text-orange-600 border border-orange-200',
}

const DOT_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
  orange: 'bg-orange-500',
}

export default function Badge({ tone = 'slate', dot = false, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${TONES[tone] || TONES.slate} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[tone] || 'bg-slate-400'}`} />}
      {children}
    </span>
  )
}
