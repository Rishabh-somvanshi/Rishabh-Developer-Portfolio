/**
 * SVG planet renderer. Each world is a config: sphere gradient, surface
 * bands, optional ring (split back/front so it passes behind the sphere),
 * night-side city lights, pulsing aura. Muted palettes so the page keeps
 * a single amber accent.
 */

const R = 130 // planet radius in the 420x420 viewBox
const C = 210 // centre

function Ring({ id, tint, tilt = -18, back }) {
  // ellipse ring split into back (drawn under sphere) and front halves
  const rx = R * 1.72
  const ry = R * 0.4
  return (
    <g transform={`rotate(${tilt} ${C} ${C})`} className="planet-ring">
      <clipPath id={`${id}-${back ? 'top' : 'bottom'}`}>
        <rect x={C - rx - 10} y={back ? C - ry - 12 : C} width={rx * 2 + 20} height={ry + 12} />
      </clipPath>
      <g clipPath={`url(#${id}-${back ? 'top' : 'bottom'})`}>
        <ellipse cx={C} cy={C} rx={rx} ry={ry} fill="none" stroke={tint} strokeWidth="2.4" opacity="0.75" />
        <ellipse cx={C} cy={C} rx={rx * 0.9} ry={ry * 0.9} fill="none" stroke={tint} strokeWidth="1" opacity="0.4" />
      </g>
    </g>
  )
}

export default function Planet({ world, className = '', style }) {
  const {
    key,
    top,        // lit-side colour
    bottom,     // shadow-side colour
    band,       // surface band colour
    ring,       // ring tint or null
    ringTilt = -18,
    lights = 0, // night-side city lights count
    aura,       // pulsing aura colour or null
    seams = false, // vault: meridian seams
  } = world

  const id = `pl-${key}`

  // deterministic pseudo-random light positions on the shadow side
  const lightDots = Array.from({ length: lights }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180
    const rr = R * (0.35 + ((i * 53) % 40) / 100)
    return {
      x: C + Math.cos(a) * rr * 0.9 + R * 0.18,
      y: C + Math.sin(a) * rr * 0.55 + R * 0.22,
    }
  }).filter((p) => Math.hypot(p.x - C, p.y - C) < R * 0.94)

  return (
    <svg viewBox="0 0 420 420" className={`planet planet-${key} ${className}`} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-sphere`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor={top} />
          <stop offset="58%" stopColor={bottom} />
          <stop offset="100%" stopColor="#08080a" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="34%" cy="28%" r="90%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.72)" />
        </radialGradient>
        {aura && (
          <radialGradient id={`${id}-aura`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="78%" stopColor={aura} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        )}
        <clipPath id={`${id}-clip`}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
      </defs>

      {aura && <circle cx={C} cy={C} r={R * 1.42} fill={`url(#${id}-aura)`} className="planet-aura" />}

      {ring && <Ring id={id} tint={ring} tilt={ringTilt} back />}

      {/* sphere */}
      <circle cx={C} cy={C} r={R} fill={`url(#${id}-sphere)`} />

      {/* surface bands */}
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx={C - 14} cy={C - R * 0.36} rx={R * 1.06} ry={R * 0.16} fill={band} opacity="0.22" />
        <ellipse cx={C + 20} cy={C + R * 0.08} rx={R * 1.1} ry={R * 0.2} fill={band} opacity="0.16" />
        <ellipse cx={C - 6} cy={C + R * 0.52} rx={R * 0.95} ry={R * 0.14} fill={band} opacity="0.2" />
        {seams && (
          <>
            <ellipse cx={C} cy={C} rx={R * 0.55} ry={R} fill="none" stroke={band} strokeWidth="1.2" opacity="0.35" />
            <ellipse cx={C} cy={C} rx={R * 0.95} ry={R} fill="none" stroke={band} strokeWidth="1" opacity="0.22" />
          </>
        )}
        {/* night-side city lights — the one amber allowed on a world */}
        {lightDots.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.8 : 1.1} fill="#e8942a" opacity={0.55 + (i % 4) * 0.1} />
        ))}
        {/* terminator shading */}
        <circle cx={C} cy={C} r={R} fill={`url(#${id}-shade)`} />
      </g>

      {/* limb highlight */}
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(237,237,239,0.14)" strokeWidth="1" />

      {ring && <Ring id={id} tint={ring} tilt={ringTilt} />}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* The four worlds, chronological. Muted palettes; amber stays scarce. */
/* ------------------------------------------------------------------ */
export const WORLD_VISUALS = {
  porcelain: {
    key: 'porcelain',
    top: '#c9a79b',
    bottom: '#4a3733',
    band: '#e8d5cc',
    ring: '#a08a82',
    ringTilt: -14,
    lights: 0,
    aura: null,
  },
  vault: {
    key: 'vault',
    top: '#7c98a1',
    bottom: '#233238',
    band: '#9fb6bd',
    ring: '#77878d',
    ringTilt: -24,
    lights: 0,
    aura: null,
    seams: true,
  },
  mercantile: {
    key: 'mercantile',
    top: '#c08b52',
    bottom: '#452b18',
    band: '#e0aa70',
    ring: null,
    lights: 14,
    aura: null,
  },
  curo: {
    key: 'curo',
    top: '#6fa398',
    bottom: '#1e3833',
    band: '#8fc0b4',
    ring: null,
    lights: 0,
    aura: 'rgba(111,163,152,0.32)',
  },
}
