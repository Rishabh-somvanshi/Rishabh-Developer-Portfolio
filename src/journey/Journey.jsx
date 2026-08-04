import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import Starfield from './Starfield'
import Hud from './Hud'
import Launch from './Launch'
import Origins from './Origins'
import WorldScene from './WorldScene'
import TwinLights from './TwinLights'
import Singularity from './Singularity'
import Reentry from './Reentry'
import Home from './Home'
import { WORLD_VISUALS } from './Planet'
import { experience } from '../data/content'
import '../styles/journey.css'

/*
 * The worlds, newest first — the way home runs back through time.
 * experience[] is newest-first: 0 Optum · 1 Albertsons · 2 Fiserv · 3 Estée · 4 SRM
 */
const WORLDS = [
  {
    id: 'curo',
    entry: '01',
    world: 'Curo',
    epithet: 'the living world',
    exp: experience[0],
    visual: WORLD_VISUALS.curo,
    flip: false,
    current: true,
    height: 185,
    log:
      'The largest world yet, and a living one. Care moves through it like weather — the interfaces must never flinch.',
  },
  {
    id: 'mercantile',
    entry: '02',
    world: 'Mercantile',
    epithet: 'the market world',
    exp: experience[1],
    visual: WORLD_VISUALS.mercantile,
    flip: true,
    moons: ['Applause', 'Best Performer', 'On-The-Spot'],
    height: 195,
    log:
      'A trading world in constant motion — gift cards by the thousands, tracked in real time, secured at every gate.',
  },
  {
    id: 'vault',
    entry: '03',
    world: 'Vault',
    epithet: 'the fortress world',
    exp: experience[2],
    visual: WORLD_VISUALS.vault,
    flip: false,
    log:
      'A fortress economy: money moves only through proof. I built the proofs — 3-D Secure, one-time codes, doors that open exactly once.',
  },
  {
    id: 'porcelain',
    entry: '04',
    world: 'Porcelain',
    epithet: 'the beauty world',
    exp: experience[3],
    visual: WORLD_VISUALS.porcelain,
    flip: true,
    log:
      'The first landfall, back at the start — a world that launched beauty at planetary scale; its product data had to hold still while everything else moved.',
  },
]

/** The voyage — a scroll-driven journey home through six and a half years. */
export default function Journey({ onSkip }) {
  const fx = useRef({ warp: 0, well: 0, wellX: 0.5, wellY: 0.42 })
  const reduced = useReducedMotion()

  // safety: never leave FX on when scenes unmount mid-scroll
  useEffect(() => {
    const f = fx.current
    return () => {
      f.warp = 0
      f.well = 0
    }
  }, [])

  return (
    <div className="journey" id="top">
      <Starfield fx={fx} still={!!reduced} />
      <Hud onSkip={onSkip} />
      <main>
        <Launch onSkip={onSkip} />
        {WORLDS.map((w) => (
          <WorldScene key={w.id} {...w} />
        ))}
        <Origins />
        <TwinLights />
        <Singularity fx={fx} reduced={reduced} />
        <Reentry fx={fx} reduced={reduced} />
        <Home onSkip={onSkip} />
      </main>
    </div>
  )
}
