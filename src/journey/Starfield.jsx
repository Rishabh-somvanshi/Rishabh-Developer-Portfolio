import { useEffect, useRef } from 'react'

/**
 * Fixed full-viewport canvas starfield behind the voyage.
 *
 * Reads scene FX from a shared mutable ref (no re-renders):
 *   fx.current = {
 *     warp: 0..1     — re-entry: stars stretch into streaks
 *     well: 0..1     — black hole: gravitational lensing strength
 *     wellX, wellY   — lens centre in viewport fractions
 *   }
 * Scroll drift is measured internally from window.scrollY.
 */
export default function Starfield({ fx, still = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w = 0
    let h = 0
    let dpr = 1
    let stars = []
    let shooters = [] // ambient shooting stars
    let raf = 0
    let lastY = window.scrollY
    let drift = 0
    let running = true

    const AMBER = [232, 148, 42]

    function spawnShooter() {
      const fromLeft = Math.random() < 0.5
      shooters.push({
        x: fromLeft ? -40 : Math.random() * w * 0.9,
        y: fromLeft ? Math.random() * h * 0.5 : -40,
        vx: 4.2 + Math.random() * 3.4,
        vy: 2.4 + Math.random() * 2.2,
        life: 0,
        max: 55 + Math.random() * 35,
        amber: Math.random() < 0.3,
      })
    }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(Math.round((w * h) / 4200), 280)
      stars = Array.from({ length: count }, () => {
        const depth = Math.random() < 0.55 ? 0.35 : Math.random() < 0.75 ? 0.65 : 1
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z: depth,
          r: depth * (Math.random() * 0.9 + 0.55),
          tw: Math.random() * Math.PI * 2,
          ts: 0.4 + Math.random() * 1.1,
          amber: Math.random() < 0.06,
        }
      })
    }

    function frame(t) {
      if (!running) return
      const { warp = 0, well = 0, wellX = 0.5, wellY = 0.45 } = fx.current

      // scroll drift — stars slide up gently as the ship moves
      const y = window.scrollY
      drift = drift * 0.9 + (y - lastY) * 0.1
      lastY = y

      ctx.clearRect(0, 0, w, h)

      const cx = wellX * w
      const cy = wellY * h
      const horizon = Math.min(w, h) * 0.09 // event-horizon radius for lensing falloff

      for (const s of stars) {
        // parallax drift (wraps vertically)
        s.y -= drift * 0.14 * s.z
        if (s.y < -8) s.y += h + 16
        if (s.y > h + 8) s.y -= h + 16

        let px = s.x
        let py = s.y
        let bright = 0.35 + s.z * 0.4

        if (!still) {
          bright += 0.22 * Math.sin(t * 0.001 * s.ts + s.tw)
        }

        // gravitational lensing — pull positions toward the well, swirl tangentially
        if (well > 0.01) {
          const dx = cx - px
          const dy = cy - py
          const dist = Math.hypot(dx, dy) + 0.0001
          const pull = (well * 5200 * s.z) / (dist * dist + horizon * horizon)
          const k = Math.min(pull, 0.55)
          // radial pull + tangential swirl
          px += dx * k + -dy * k * 0.6
          py += dy * k + dx * k * 0.6
          const nd = Math.hypot(cx - px, cy - py)
          if (nd < horizon * (0.85 + well * 0.4)) continue // swallowed
          if (nd < horizon * 3) bright += well * 0.35 // photon-ring shimmer
        }

        const a = Math.max(0.06, Math.min(bright, 1))
        const col = s.amber
          ? `rgba(${AMBER[0]},${AMBER[1]},${AMBER[2]},${a})`
          : `rgba(237,237,239,${a})`

        if (warp > 0.02) {
          // re-entry streaks — stars stretch along travel axis
          const len = warp * (18 + 64 * s.z) + Math.abs(drift) * 0.35 * s.z
          const grad = ctx.createLinearGradient(px, py - len, px, py + len * 0.2)
          grad.addColorStop(0, 'rgba(237,237,239,0)')
          grad.addColorStop(0.7, col)
          grad.addColorStop(1, col)
          ctx.strokeStyle = grad
          ctx.lineWidth = Math.max(s.r * (1 - warp * 0.4), 0.4)
          ctx.beginPath()
          ctx.moveTo(px, py - len)
          ctx.lineTo(px, py + len * 0.2)
          ctx.stroke()
        } else {
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(px, py, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ambient shooting stars — sparse, diagonal, with fading tails
      if (!still) {
        if (shooters.length < 2 && Math.random() < 0.007) spawnShooter()
        for (let i = shooters.length - 1; i >= 0; i--) {
          const s = shooters[i]
          s.x += s.vx
          s.y += s.vy
          s.life++
          if (s.life > s.max || s.x > w + 60 || s.y > h + 60) {
            shooters.splice(i, 1)
            continue
          }
          const fade = Math.sin((s.life / s.max) * Math.PI) // in and out
          const tail = 46 + fade * 44
          const tx = s.x - s.vx * (tail / 6)
          const ty = s.y - s.vy * (tail / 6)
          const grad = ctx.createLinearGradient(tx, ty, s.x, s.y)
          const col = s.amber ? `rgba(245,169,61,${0.75 * fade})` : `rgba(237,237,239,${0.7 * fade})`
          grad.addColorStop(0, 'rgba(237,237,239,0)')
          grad.addColorStop(1, col)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(s.x, s.y)
          ctx.stroke()
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (!still) raf = requestAnimationFrame(frame)
    }

    function onVis() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!still) {
        running = true
        lastY = window.scrollY
        raf = requestAnimationFrame(frame)
      }
    }

    build()
    if (still) {
      frame(0) // single static frame
    } else {
      raf = requestAnimationFrame(frame)
    }
    window.addEventListener('resize', build)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fx, still])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
