import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The shell chunk (text, HUD, audio) must never pull in three.js: that is
 * what keeps the voyage's text on screen in under a second. Only the lazy
 * World chunk may import it.
 */
const here = dirname(fileURLToPath(import.meta.url))
const SHELL_SIDE = [
  '../store.js',
  '../sceneWindows.js',
  '../interp.js',
  '../fxCurves.js',
  '../webgl.js',
  '../WebGLBoundary.jsx',
  '../camera/path.js',
  '../camera/framing.js',
  '../camera/stations.js',
  '../quality/tiers.js',
  '../audio/score.js',
  '../audio/synth.js',
  '../audio/voices.js',
  '../audio/context.js',
  '../audio/engine.js',
  '../audio/SoundToggle.jsx',
  '../../journey/Journey.jsx',
  '../../journey/Hud.jsx',
  '../../data/voyage.js',
]
const HEAVY_IMPORT = /from\s+['"](three|@react-three\/[^'"]+|postprocessing)['"]/

describe('chunk boundary', () => {
  it.each(SHELL_SIDE)('%s does not import three.js', (rel) => {
    const file = join(here, rel)
    expect(existsSync(file), `${rel} missing`).toBe(true)
    expect(readFileSync(file, 'utf8')).not.toMatch(HEAVY_IMPORT)
  })
})
