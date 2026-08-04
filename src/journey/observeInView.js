/**
 * Call back as an element enters and leaves the viewport.
 *
 * Used to park a scene while it is scrolled past. Fifteen infinite animations
 * run across the voyage and almost none are visible at any moment, so parking
 * the off-screen ones is most of the win.
 *
 * Where IntersectionObserver is unavailable, reports visible and does nothing
 * further — a permanently frozen scene would be a worse failure than paying
 * for animation.
 */
export function observeInView(el, onChange, { rootMargin = '200px' } = {}) {
  if (typeof IntersectionObserver === 'undefined' || !el) {
    onChange(true)
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => onChange(entries[entries.length - 1].isIntersecting),
    { rootMargin },
  )
  observer.observe(el)
  return () => observer.disconnect()
}
