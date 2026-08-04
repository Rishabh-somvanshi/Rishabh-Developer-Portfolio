/**
 * EVA-suit astronaut, flat-illustration style with real shading.
 * Two poses: "drift" (weightless, limbs floating) and "stand" (planted).
 * Palette stays in-system: warm greys for the suit, one amber visor accent.
 */

function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-suit`} x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stopColor="#e2e2e8" />
        <stop offset="55%" stopColor="#c2c2cb" />
        <stop offset="100%" stopColor="#8e8e9a" />
      </linearGradient>
      <linearGradient id={`${id}-limb`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#d6d6dd" />
        <stop offset="100%" stopColor="#9a9aa6" />
      </linearGradient>
      <radialGradient id={`${id}-helmet`} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f0f0f4" />
        <stop offset="70%" stopColor="#c6c6cf" />
        <stop offset="100%" stopColor="#83838f" />
      </radialGradient>
      <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#2b2b33" />
        <stop offset="45%" stopColor="#121217" />
        <stop offset="100%" stopColor="#1d1d24" />
      </linearGradient>
      <linearGradient id={`${id}-pack`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3a3a42" />
        <stop offset="100%" stopColor="#23232a" />
      </linearGradient>
      <linearGradient id={`${id}-visref`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgba(245,169,61,0.9)" />
        <stop offset="100%" stopColor="rgba(245,169,61,0)" />
      </linearGradient>
    </defs>
  )
}

/* One arm: shoulder→elbow→glove, built along +x then rotated into place */
function Arm({ id, x, y, upper, fore, aU, aF, flip }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${aU})${flip ? ' scale(1 -1)' : ''}`}>
      <rect x="-6" y="-8" width={upper + 12} height="16" rx="8" fill={`url(#${id}-limb)`} stroke="#6d6d78" strokeWidth="1.6" />
      <g transform={`translate(${upper} 0) rotate(${aF})`}>
        <rect x="-5" y="-7" width={fore + 10} height="14" rx="7" fill={`url(#${id}-limb)`} stroke="#6d6d78" strokeWidth="1.6" />
        {/* cuff + glove */}
        <rect x={fore - 4} y="-8" width="5" height="16" rx="2" fill="#e8942a" opacity="0.85" />
        <circle cx={fore + 8} cy="0" r="8.5" fill="#8f8f9b" stroke="#5f5f6a" strokeWidth="1.6" />
      </g>
      <circle cx="0" cy="0" r="8" fill={`url(#${id}-limb)`} stroke="#6d6d78" strokeWidth="1.6" />
    </g>
  )
}

/* One leg: hip→knee→boot */
function Leg({ id, x, y, thigh, shin, aT, aK }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${aT})`}>
      <rect x="-8" y="-9" width={thigh + 14} height="18" rx="9" fill={`url(#${id}-limb)`} stroke="#6d6d78" strokeWidth="1.6" />
      <g transform={`translate(${thigh} 0) rotate(${aK})`}>
        <rect x="-6" y="-8" width={shin + 10} height="16" rx="8" fill={`url(#${id}-limb)`} stroke="#6d6d78" strokeWidth="1.6" />
        {/* boot */}
        <path
          d={`M${shin - 2} -9 h14 a6 6 0 0 1 6 6 v7 a4 4 0 0 1 -4 4 h-16 z`}
          fill="#4a4a54"
          stroke="#33333b"
          strokeWidth="1.6"
        />
      </g>
    </g>
  )
}

function Body({ id, pose }) {
  const drift = pose === 'drift'
  return (
    <g>
      {/* PLSS life-support pack */}
      <rect x="52" y="54" width="30" height="66" rx="9" fill={`url(#${id}-pack)`} stroke="#17171c" strokeWidth="1.6" />
      <rect x="57" y="62" width="20" height="4" rx="2" fill="#55555f" />
      <rect x="57" y="70" width="20" height="4" rx="2" fill="#55555f" />

      {/* oxygen hose */}
      <path
        d="M82 96 q22 14 24 -8"
        fill="none"
        stroke="#71717c"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* torso */}
      <path
        d="M74 52
           h52
           a10 10 0 0 1 10 10
           l-3 46
           a12 12 0 0 1 -12 11
           h-42
           a12 12 0 0 1 -12 -11
           l-3 -46
           a10 10 0 0 1 10 -10 z"
        fill={`url(#${id}-suit)`}
        stroke="#6d6d78"
        strokeWidth="1.8"
      />
      {/* torso side shadow */}
      <path
        d="M114 52 h12 a10 10 0 0 1 10 10 l-3 46 a12 12 0 0 1 -12 11 h-10 z"
        fill="rgba(10,10,11,0.22)"
      />
      {/* chest control panel */}
      <rect x="84" y="66" width="32" height="22" rx="4" fill="#2e2e36" stroke="#1c1c22" strokeWidth="1.4" />
      <circle cx="92" cy="73" r="2.6" fill="#e8942a" />
      <circle cx="101" cy="73" r="2.6" fill="#7f7f8a" />
      <circle cx="110" cy="73" r="2.6" fill="#7f7f8a" />
      <rect x="88" y="80" width="24" height="3.5" rx="1.75" fill="#55555f" />
      {/* waist seal */}
      <rect x="72" y="112" width="56" height="9" rx="4.5" fill="#8f8f9b" stroke="#5f5f6a" strokeWidth="1.4" />

      {/* neck ring */}
      <rect x="87" y="44" width="26" height="10" rx="5" fill="#9a9aa6" stroke="#5f5f6a" strokeWidth="1.5" />

      {/* helmet */}
      <circle cx="100" cy="26" r="24" fill={`url(#${id}-helmet)`} stroke="#6d6d78" strokeWidth="1.8" />
      {/* visor opening */}
      <path
        d="M84 20 a20 17 0 0 1 32 0 q3 5 1 12 a17 14 0 0 1 -34 0 q-2 -7 1 -12 z"
        fill={`url(#${id}-visor)`}
        stroke="#3c3c45"
        strokeWidth="1.5"
      />
      {/* amber sky reflected in the visor */}
      <path d="M88 20 a15 12 0 0 1 17 -4" fill="none" stroke={`url(#${id}-visref)`} strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="28" r="2" fill="rgba(237,237,239,0.75)" />
      {/* helmet lamp */}
      <rect x="76" y="12" width="7" height="10" rx="3" fill="#4a4a54" stroke="#33333b" strokeWidth="1.2" />

      {drift && (
        /* drifting tether */
        <path
          d="M70 118 q-26 16 -34 44"
          fill="none"
          stroke="#82828b"
          strokeWidth="1.6"
          strokeDasharray="2 6"
          strokeLinecap="round"
          opacity="0.65"
        />
      )}
    </g>
  )
}

export default function Astronaut({ pose = 'drift', className = '', style }) {
  const id = pose === 'stand' ? 'evs' : 'evd'

  if (pose === 'stand') {
    return (
      <svg viewBox="0 0 200 232" className={`astronaut ${className}`} style={style} fill="none" aria-hidden="true">
        <Defs id={id} />
        {/* legs planted */}
        <Leg id={id} x={86} y={118} thigh={44} shin={40} aT={86} aK={2} />
        <Leg id={id} x={112} y={118} thigh={44} shin={40} aT={92} aK={-2} />
        {/* arms relaxed at sides */}
        <Arm id={id} x={76} y={60} upper={34} fore={30} aU={112} aF={8} />
        <Arm id={id} x={124} y={60} upper={34} fore={30} aU={68} aF={-8} flip />
        <Body id={id} pose="stand" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 210 210" className={`astronaut ${className}`} style={style} fill="none" aria-hidden="true">
      <Defs id={id} />
      <g transform="rotate(-12 100 100)">
        {/* legs adrift, bent */}
        <Leg id={id} x={86} y={118} thigh={40} shin={36} aT={74} aK={38} />
        <Leg id={id} x={112} y={118} thigh={42} shin={36} aT={108} aK={-30} />
        {/* arms floating — one raised, one out */}
        <Arm id={id} x={76} y={60} upper={34} fore={30} aU={158} aF={-42} />
        <Arm id={id} x={124} y={60} upper={34} fore={30} aU={24} aF={-34} flip />
        <Body id={id} pose="drift" />
      </g>
    </svg>
  )
}
