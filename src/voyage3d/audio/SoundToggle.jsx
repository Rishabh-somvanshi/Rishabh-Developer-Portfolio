import { useEffect, useRef, useState } from 'react'

const BARS = 4

function activate(engine) {
  if (engine.getSnapshot().needsGesture) engine.startFromGesture()
  else engine.toggleMuted()
}

/**
 * HUD sound button. The bars follow the real output level (AnalyserNode), so
 * they move with the music rather than looping a canned animation. M toggles
 * from anywhere except a text field. Constant accessible name + aria-pressed:
 * a changing name would be announced twice alongside the pressed state.
 */
export default function SoundToggle({ engine }) {
  const [snap, setSnap] = useState(() => engine.getSnapshot())
  const bars = useRef([])

  useEffect(() => engine.subscribe(setSnap), [engine])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'm' && e.key !== 'M') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      activate(engine)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine])

  const playing = !snap.muted && snap.state === 'running'

  useEffect(() => {
    const rest = () => bars.current.forEach((b) => b && (b.style.transform = 'scaleY(0.25)'))
    const analyser = playing ? engine.getAnalyser() : null
    if (!analyser) {
      rest()
      return undefined
    }
    const data = new Uint8Array(analyser.frequencyBinCount)
    const step = Math.max(1, Math.floor(data.length / BARS))
    let frame = requestAnimationFrame(function draw() {
      analyser.getByteFrequencyData(data)
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleY(${Math.max(0.2, data[i * step] / 255).toFixed(3)})`
      })
      frame = requestAnimationFrame(draw)
    })
    return () => {
      cancelAnimationFrame(frame)
      rest()
    }
  }, [engine, playing])

  const label = snap.needsGesture ? '♪ tap for sound' : playing ? 'sound on' : 'sound off'

  return (
    <button
      type="button"
      className="hud-sound mono"
      aria-label="Sound"
      aria-pressed={playing}
      title="Sound (M)"
      onClick={() => activate(engine)}
    >
      <span className="eq" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <i key={i} ref={(el) => (bars.current[i] = el)} />
        ))}
      </span>
      <span className="hud-sound-label" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}
