/**
 * Shown while the voyage's first chunk downloads. It replaces a blank black
 * screen: the visitor has just clicked, and needs to see that something is
 * happening. The content fades in after a beat (CSS), so a chunk that was
 * already warmed never flashes it.
 */
export default function VoyageLoading() {
  return (
    <div className="voyage-loading" role="status" aria-live="polite">
      <div className="voyage-loading-inner">
        <span className="nav-logo" aria-hidden="true">
          rs<span className="dot">.</span>
        </span>
        <p className="mono">Preparing the voyage…</p>
        <i className="voyage-loading-bar" aria-hidden="true" />
      </div>
    </div>
  )
}
