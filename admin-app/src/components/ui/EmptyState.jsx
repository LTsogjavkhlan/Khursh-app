export default function EmptyState({ icon, title, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
