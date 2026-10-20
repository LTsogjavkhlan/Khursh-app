export default function Card({ interactive = false, className = '', children, ...rest }) {
  return (
    <div
      className={`bg-surface border border-line rounded-card shadow-card ${
        interactive ? 'cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-line-strong/40 hover:shadow-pop' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
