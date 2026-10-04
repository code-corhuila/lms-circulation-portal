import { useEffect, useRef, useState } from 'react'

import { apiClient } from 'shell/apiClient'

export interface SearchableOption {
  id: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  id: string
  label: string
  placeholder?: string
  searchUrl: string
  toOptions: (data: unknown) => SearchableOption[]
  value: string
  selectedLabel: string
  onChange: (id: string, label: string) => void
  error?: string
}

const DEBOUNCE_MS = 300

// Type-ahead search-and-pick, so registering a loan means typing a student's
// name or a book's title instead of pasting a raw UUID — the fields still
// hold IDs underneath (that's what /loans expects), this just spares the
// Administrator from having to know one by heart.
export function SearchableSelect({
  id,
  label,
  placeholder,
  searchUrl,
  toOptions,
  value,
  selectedLabel,
  onChange,
  error,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(selectedLabel)
  const [options, setOptions] = useState<SearchableOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const latestRequestId = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setQuery(selectedLabel)
  }, [selectedLabel])

  useEffect(() => {
    if (!isOpen) return
    if (query.trim().length === 0) {
      setOptions([])
      return
    }

    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const requestId = ++latestRequestId.current
      setIsLoading(true)
      apiClient
        .get(searchUrl, { params: { search: query, limit: 8 } })
        .then(({ data }) => {
          if (requestId !== latestRequestId.current) return
          setOptions(toOptions(data))
        })
        .catch(() => {
          if (requestId !== latestRequestId.current) return
          setOptions([])
        })
        .finally(() => {
          if (requestId !== latestRequestId.current) return
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, searchUrl])

  function handlePick(option: SearchableOption) {
    onChange(option.id, option.label)
    setQuery(option.label)
    setIsOpen(false)
  }

  function handleInputChange(next: string) {
    setQuery(next)
    setIsOpen(true)
    if (next !== selectedLabel) {
      onChange('', next)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      {/* Hidden field carrying the actual id, kept in sync via onChange —
          the visible input only ever shows the human-readable label. */}
      <input type="hidden" value={value} readOnly />

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {isLoading && <p className="px-3 py-2 text-slate-400">Searching…</p>}
          {!isLoading && options.length === 0 && (
            <p className="px-3 py-2 text-slate-400">No matches</p>
          )}
          {!isLoading &&
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(option)}
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="block text-slate-900">{option.label}</span>
                {option.sublabel && <span className="block text-xs text-slate-500">{option.sublabel}</span>}
              </button>
            ))}
        </div>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
    </div>
  )
}
