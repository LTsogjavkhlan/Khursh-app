export const fieldInputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed'

export default function FormField({ label, error, className = '', children }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
