import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { groupDigits, parseAmount, parseSigned } from '../lib/format'

/* ------------------------------------------------------------------ */
/* Icons — inline so there is no icon-font request                     */
/* ------------------------------------------------------------------ */

const svg = (d: ReactNode, size = 18) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {d}
  </svg>
)

export const Icon = {
  chevronRight: (s?: number) => svg(<polyline points="9 18 15 12 9 6" />, s),
  chevronLeft: (s?: number) => svg(<polyline points="15 18 9 12 15 6" />, s),
  check: (s?: number) => svg(<polyline points="20 6 9 17 4 12" />, s),
  plus: (s?: number) => svg(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, s),
  trash: (s?: number) =>
    svg(
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>,
      s,
    ),
  download: (s?: number) =>
    svg(
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>,
      s,
    ),
  upload: (s?: number) =>
    svg(
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>,
      s,
    ),
  printer: (s?: number) =>
    svg(
      <>
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </>,
      s,
    ),
  sun: (s?: number) =>
    svg(
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>,
      s,
    ),
  moon: (s?: number) => svg(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />, s),
  info: (s?: number) =>
    svg(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, s),
  spark: (s?: number) =>
    svg(<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z" />, s),
}

/* ------------------------------------------------------------------ */
/* Field wrappers                                                      */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string
  hint?: string
  children: (id: string) => ReactNode
  className?: string
}

export function Field({ label, hint, children, className }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children(id)}
    </div>
  )
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete = 'off',
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  )
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          className="textarea"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  )
}

/**
 * Money input. Shows grouped digits when idle, raw text while focused, so
 * editing never fights the formatter. Accepts "1.2m", "1,200", "$450k".
 */
export function MoneyField({
  label,
  hint,
  value,
  onChange,
  symbol = '$',
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  symbol?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? groupDigits(value)
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <span className="input-affix">
          <span className="affix" aria-hidden="true">
            {symbol}
          </span>
          <input
            id={id}
            className="input money"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={display}
            placeholder="0"
            onFocus={() => setDraft(value === 0 ? '' : String(value))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) onChange(parseAmount(draft))
              setDraft(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
          />
        </span>
      )}
    </Field>
  )
}

/** Plain numeric field for counts, rates and percentages. */
export function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (Number.isFinite(value) ? String(value) : '')
  const commit = (raw: string) => {
    let n = parseSigned(raw)
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    onChange(n)
  }
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <span className={`input-affix${suffix ? ' suffix' : ''}`}>
          {suffix ? (
            <span className="affix" aria-hidden="true">
              {suffix}
            </span>
          ) : null}
          <input
            id={id}
            className="input money"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={display}
            step={step}
            onFocus={() => setDraft(String(value))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) commit(draft)
              setDraft(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
          />
        </span>
      )}
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string
  hint?: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          className="select"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="field">
      <span className="field-label" id={`${label}-lbl`}>
        {label}
      </span>
      <div className="segmented" role="group" aria-labelledby={`${label}-lbl`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  sub,
  actions,
  children,
  id,
}: {
  title?: string
  sub?: string
  actions?: ReactNode
  children: ReactNode
  id?: string
}) {
  return (
    <section className="card" id={id} aria-labelledby={title ? `${id ?? title}-h` : undefined}>
      {title ? (
        <header>
          <div>
            <h2 id={`${id ?? title}-h`}>{title}</h2>
            {sub ? <p className="card-sub">{sub}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone,
  hero,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'pos' | 'neg'
  hero?: boolean
}) {
  return (
    <div className={`stat ${tone ?? ''} ${hero ? 'hero' : ''}`}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      {sub ? <div className="s">{sub}</div> : null}
    </div>
  )
}

export function Note({ children, warn }: { children: ReactNode; warn?: boolean }) {
  return <p className={`note${warn ? ' warn' : ''}`}>{children}</p>
}

/** Announces a message to screen readers without stealing focus. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="visually-hidden">
      {message}
    </div>
  )
}

/** Scrolls to top whenever the key changes — used on step navigation. */
export function useScrollTop(key: unknown) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [key])
}
