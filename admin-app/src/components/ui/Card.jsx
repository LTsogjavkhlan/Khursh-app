export default function Card({ interactive = false, className = '', children, ...rest }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${
        interactive ? 'cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-150' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
