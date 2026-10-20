// Loading placeholders. Static under reduced motion.
export function SkeletonBlock({ className = '' }) {
    return <div aria-hidden="true" className={`animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none ${className}`} />
}

// A list of card-shaped placeholders with a screen-reader loading message
export default function SkeletonList({ rows = 3, label = 'Ачаалж байна…' }) {
    return (
        <div role="status" aria-live="polite" className="space-y-3">
            <span className="sr-only">{label}</span>
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="rounded-card border border-line bg-surface p-4">
                    <SkeletonBlock className="h-4 w-2/5" />
                    <SkeletonBlock className="mt-3 h-3 w-4/5" />
                    <SkeletonBlock className="mt-2 h-3 w-3/5" />
                </div>
            ))}
        </div>
    )
}
