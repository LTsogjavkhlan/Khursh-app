// Base surface for grouped content. `as` lets a card be a <section>, <li>, etc.
export default function Card({ as = 'div', padded = true, className = '', children, ...rest }) {
    const Tag = as
    return (
        <Tag className={`rounded-card border border-line bg-surface shadow-card ${padded ? 'p-4' : ''} ${className}`} {...rest}>
            {children}
        </Tag>
    )
}
