/**
 * Runs `fn` once the browser has nothing better to do, and returns a cancel.
 *
 * Prefetching is only worth doing if it never competes with the work in front
 * of the user, so everything here is best-effort: the timeout is a ceiling,
 * not a schedule. Safari before 16.4 has no requestIdleCallback, hence the
 * timer fallback.
 */
export function onIdle(fn: () => void, timeout = 2000): () => void {
  const idle =
    typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback : null
  if (idle) {
    const h = idle(fn, { timeout })
    return () => window.cancelIdleCallback?.(h)
  }
  const t = window.setTimeout(fn, 400)
  return () => window.clearTimeout(t)
}
