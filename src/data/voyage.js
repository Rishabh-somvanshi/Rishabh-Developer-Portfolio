import { experience } from './content'

/**
 * Everything the voyage's text layer, 3D world and soundscape share. Plain
 * data only: this module is imported by the lightweight shell chunk, so it
 * must never import three.js.
 */

/** Scene order along the voyage — also the HUD rail order and the camera path. */
export const SCENE_IDS = [
  'launch',
  'curo',
  'mercantile',
  'vault',
  'porcelain',
  'origins',
  'stars',
  'singularity',
  'reentry',
  'home',
]

/** Surface palettes, copied from the retired SVG planets — muted so amber stays the one accent. */
export const PALETTES = {
  curo: { top: '#6fa398', bottom: '#1e3833', band: '#8fc0b4', ring: null, ringTilt: 0, aura: '#6fa398', lights: 0 },
  mercantile: { top: '#c08b52', bottom: '#452b18', band: '#e0aa70', ring: null, ringTilt: 0, aura: null, lights: 14 },
  vault: { top: '#7c98a1', bottom: '#233238', band: '#9fb6bd', ring: '#77878d', ringTilt: -24, aura: null, lights: 0 },
  porcelain: { top: '#c9a79b', bottom: '#4a3733', band: '#e8d5cc', ring: '#a08a82', ringTilt: -14, aura: null, lights: 0 },
}

export const MOON_AWARDS = ['Applause', 'Best Performer', 'On-The-Spot']

/** Scene progress at which each award moon starts to rise (the old DOM moons used 0.3 + i·0.08). */
export const MOON_RISE = [0.3, 0.38, 0.46]

/** Scene progress at which the Vault's shield lattice starts its sweep. */
export const VAULT_SHIELD_AT = 0.2

/* The worlds, newest first — the way home runs back through time.
   experience[] is newest-first: 0 Optum · 1 Albertsons · 2 Fiserv · 3 Estée · 4 SRM */
export const WORLDS = [
  {
    id: 'curo',
    entry: '01',
    world: 'Curo',
    epithet: 'the living world',
    exp: experience[0],
    flip: false,
    current: true,
    height: 185,
    log: 'The largest world yet, and a living one. Care moves through it like weather — the interfaces must never flinch.',
  },
  {
    id: 'mercantile',
    entry: '02',
    world: 'Mercantile',
    epithet: 'the market world',
    exp: experience[1],
    flip: true,
    moons: MOON_AWARDS,
    height: 195,
    log: 'A trading world in constant motion — gift cards by the thousands, tracked in real time, secured at every gate.',
  },
  {
    id: 'vault',
    entry: '03',
    world: 'Vault',
    epithet: 'the fortress world',
    exp: experience[2],
    flip: false,
    log: 'A fortress economy: money moves only through proof. I built the proofs — 3-D Secure, one-time codes, doors that open exactly once.',
  },
  {
    id: 'porcelain',
    entry: '04',
    world: 'Porcelain',
    epithet: 'the beauty world',
    exp: experience[3],
    flip: true,
    log: 'The first landfall, back at the start — a world that launched beauty at planetary scale; its product data had to hold still while everything else moved.',
  },
]

/** The four labelled fundamentals in the Origin field. */
export const ORIGIN_METEORS = [
  { label: 'Data structures', amber: false },
  { label: 'Algorithms', amber: false },
  { label: 'C · Python', amber: false },
  { label: '5★ HackerRank', amber: true },
]

/** Origins scene progress at which a meteor whooshes past, and where it sits in the stereo field. */
export const METEOR_PASSES = [
  { at: 0.15, pan: -0.6 },
  { at: 0.3, pan: 0.5 },
  { at: 0.45, pan: 0.7 },
  { at: 0.6, pan: -0.4 },
]

/** One full pulsar rotation. Two beams → a sweep, and an audio tick, every half period. */
export const PULSAR_PERIOD_S = 1.6

/**
 * Rick's track. `introEnd`/`dropAt` (seconds) are filled in once the file is
 * analysed; until then both are null and the engine just plays the file from
 * the start, looping the whole thing. Once both are numbers the engine loops
 * the intro until the reader's first flight, then drops.
 */
export const TRACK = { src: '/audio/voyage.mp3', introEnd: null, dropAt: null }
