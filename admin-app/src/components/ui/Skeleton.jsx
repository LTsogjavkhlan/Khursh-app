function Line({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none bg-surface-muted rounded-md ${className}`} />
}

function Row() {
  return (
    <div className="bg-surface border border-line rounded-card px-5 py-4 flex items-center gap-4">
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
    <div className="bg-surface border border-line rounded-card p-5 space-y-3">
      <Line className="h-3.5 w-1/3" />
      <Line className="h-7 w-1/2" />
      <Line className="h-3 w-2/3" />
    </div>
  )
}

function List({ rows = 4 }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Ачаалж байна…</span>
      {Array.from({ length: rows }).map((_, i) => <Row key={i} />)}
    </div>
  )
}

const Skeleton = { Line, Row, Card: CardSkeleton, List }
export default Skeleton
