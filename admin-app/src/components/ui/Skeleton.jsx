function Line({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
}

function Row() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <Line className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Line className="h-3.5 w-1/3" />
        <Line className="h-3 w-1/2" />
      </div>
      <Line className="h-6 w-16 rounded-full" />
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <Line className="h-3.5 w-1/4" />
      <Line className="h-3 w-full" />
      <Line className="h-3 w-2/3" />
    </div>
  )
}

function List({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <Row key={i} />)}
    </div>
  )
}

const Skeleton = { Line, Row, Card: CardSkeleton, List }
export default Skeleton
