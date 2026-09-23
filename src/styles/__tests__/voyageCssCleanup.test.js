import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '../journey.css'), 'utf8')
const journeyDir = join(here, '../../journey')
const jsx = readdirSync(journeyDir)
  .filter((f) => f.endsWith('.jsx'))
  .map((f) => [f, readFileSync(join(journeyDir, f), 'utf8')])

/** Selectors for the SVG/CSS visuals the 3D world replaced. */
const REMOVED_SELECTORS = [
  /\.planet-aura\b/,
  /\.moons?(?![-\w])/,
  /\.moon-[0-2]\b/,
  /\.meteor(?![\w])/,
  /\.nova(?![\w])/,
  /\.pulsar(?![\w])/,
  /\.bh(?![\w])/,
  /\.earth::before/,
  /\.earth-sunrise/,
  /\.earth-lights/,
  /\.float-slow/,
  /@keyframes\s+(floaty|aura-pulse|meteor-pulse|ping|spin)\b/,
]

// moons?(?!-(?:caption|label)...) excludes .moon-caption / .moon-label: the brief
// keeps both (WorldScene's moon-caption paragraph, CSS's .moon-label rule) — the
// unqualified `moons?` here would otherwise false-positive on those compound
// tokens the same way it correctly catches retired ones like moon-0/moon-1/moon-2.
const REMOVED_CLASSNAMES = /className="[^"]*(?<![-\w])(?:nova|pulsar|bh|meteor|moons?(?!-(?:caption|label)(?![\w-]))|earth-sunrise|earth-lights|float-slower)(?:-[\w-]+)?(?![-\w])/

describe('voyage stylesheet after the 3D rebuild', () => {
  it.each(REMOVED_SELECTORS.map((r) => [r.source, r]))('no longer contains %s', (_, re) => {
    expect(css).not.toMatch(re)
  })

  it('keeps the slots that the 3D world frames into', () => {
    expect(css).toMatch(/\.planet-slot\s*\{[^}]*aspect-ratio:\s*1/)
    expect(css).toMatch(/\.twin-slot\s*\{[^}]*aspect-ratio:\s*1/)
  })

  it('keeps the moon label style the 3D labels reuse', () => {
    expect(css).toMatch(/\.moon-label\s*\{/)
  })

  it.each(jsx)('%s no longer renders the retired visuals', (_, source) => {
    expect(source).not.toMatch(REMOVED_CLASSNAMES)
  })
})
