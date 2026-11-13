import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { MAX_QUERY } from '../lib/list-filters'

const DEBOUNCE_MS = 250

/**
 * The "Search notes" box. What's typed is held here and handed on only once
 * typing pauses, so the list (and the URL) changes per word, not per key.
 *
 * `value` is the search in force. When it changes from outside — Clear
 * filters, or Back — the box follows, unless it already says the same thing
 * (it may carry a trailing space the search itself drops).
 */
export function NoteSearch({
  value,
  onSearch,
  className,
}: {
  value: string
  onSearch: (q: string) => void
  className?: string
}) {
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  // Adjusting state during render, React's way to follow a prop without an
  // effect's extra paint.
  if (value !== seen) {
    setSeen(value)
    if (value !== text.trim()) setText(value)
  }

  // Through a ref so a parent passing a fresh callback each render doesn't
  // restart the pause.
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  })

  useEffect(() => {
    const next = text.trim()
    if (next === value) return
    const timer = setTimeout(() => onSearchRef.current(next), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, value])

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          // Enter searches now rather than after the pause.
          if (event.key === 'Enter') onSearchRef.current(text.trim())
        }}
        maxLength={MAX_QUERY}
        placeholder="Search notes"
        aria-label="Search notes"
        className="h-11 pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('')
            onSearchRef.current('')
          }}
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
