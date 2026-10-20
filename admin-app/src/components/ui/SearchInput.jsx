import { Search } from 'lucide-react'
import { fieldInputCls } from './FormField'

// Toolbar search box: icon, accessible name, no browser autofill.
export default function SearchInput({ value, onChange, label, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${fieldInputCls.replace('py-2.5', '')} h-9 py-1 pl-9`}
      />
    </div>
  )
}
