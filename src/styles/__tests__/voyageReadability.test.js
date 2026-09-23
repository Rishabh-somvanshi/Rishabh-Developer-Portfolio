import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Deliberately not `new URL('../journey.css', import.meta.url)` — see the
// comment in noAnimatedBlur.test.js: that literal is rewritten by Vite into
// a dev-server URL and breaks readFileSync under jsdom.
const journeyCssPath = join(dirname(fileURLToPath(import.meta.url)), '../journey.css')
// Strip comments before parsing: a selector immediately preceded by a /* ... */
// doc comment otherwise gets swallowed into the same "selector" capture group
// as the regex-based rule splitter below walks text between braces.
const css = readFileSync(journeyCssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * Split a stylesheet into { selectors: string[], body, raw } rule records,
 * ignoring at-rule preludes but capturing which @media block (if any) a rule
 * lives inside, since the phone-strength scrim rule is nested in one.
 */
function rules(source) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = re.exec(source))) {
    const selector = match[1].trim()
    if (selector.startsWith('@')) continue
    out.push({
      selectors: selector.split(',').map((s) => s.trim()),
      body: match[2],
      index: match.index,
    })
  }
  return out
}

/** Byte ranges of every `@media (max-width: 900px) { ... }` block, via balanced braces. */
function phoneMediaRanges(source) {
  const ranges = []
  const opener = /@media\s*\(max-width:\s*900px\)\s*\{/g
  let match
  while ((match = opener.exec(source))) {
    let depth = 1
    let i = match.index + match[0].length
    const start = i
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++
      else if (source[i] === '}') depth--
      i++
    }
    ranges.push([start, i - 1])
  }
  return ranges
}

const allRules = rules(css)
const phoneRanges = phoneMediaRanges(css)
const inPhoneBlock = (index) => phoneRanges.some(([start, end]) => index >= start && index < end)

/** Find the rule whose selector list contains `${target}::before`. */
function findScrimRule(target, { phone = false } = {}) {
  return allRules.find(
    (r) => r.selectors.includes(`${target}::before`) && inPhoneBlock(r.index) === phone,
  )
}

/** Find a rule that sets `position: relative` on the bare `target` selector. */
function findBlockRule(target) {
  return allRules.find((r) => r.selectors.includes(target) && !inPhoneBlock(r.index))
}

describe('voyage text scrims (readability over planets/stars)', () => {
  it.each(['.world-card', '.scene-copy'])('%s has a ::before scrim rule', (target) => {
    const rule = findScrimRule(target)
    expect(rule, `expected a top-level ::before rule for ${target}`).toBeTruthy()
  })

  it.each(['.world-card', '.scene-copy'])('%s scrim has no blur or backdrop-filter', (target) => {
    const rule = findScrimRule(target)
    expect(rule.body).not.toMatch(/blur\(/)
    expect(rule.body).not.toMatch(/backdrop-filter/)
  })

  it.each(['.world-card', '.scene-copy'])('%s scrim is a non-interactive layer behind the text', (target) => {
    const rule = findScrimRule(target)
    expect(rule.body).toMatch(/position:\s*absolute/)
    expect(rule.body).toMatch(/z-index:\s*-1/)
    expect(rule.body).toMatch(/pointer-events:\s*none/)
    expect(rule.body).toMatch(/inset:/)
  })

  it.each(['.world-card', '.scene-copy'])('%s scrim paints a dark radial vignette', (target) => {
    const rule = findScrimRule(target)
    expect(rule.body).toMatch(/radial-gradient/)
    expect(rule.body).toMatch(/rgba\(10,\s*10,\s*11,/)
  })

  it.each(['.world-card', '.scene-copy', '.study-card-j', '.manifest', '.home-inner'])(
    '%s establishes a positioned, isolated stacking context for its scrim',
    (target) => {
      const rule = findBlockRule(target)
      expect(rule, `expected a top-level rule for ${target}`).toBeTruthy()
      expect(rule.body).toMatch(/position:\s*relative/)
      expect(rule.body).toMatch(/isolation:\s*isolate/)
    },
  )

  it('deepens the scrim on phones (max-width: 900px)', () => {
    const rule = allRules.find(
      (r) =>
        r.selectors.some((s) => s.endsWith('::before')) &&
        inPhoneBlock(r.index) &&
        /rgba\(10,\s*10,\s*11,\s*0\.86\)/.test(r.body),
    )
    expect(rule, 'expected a phone-strength (0.86) scrim rule inside the 900px media block').toBeTruthy()
  })
})

// Declaration-level blur/backdrop-filter checks (not a raw text scan, which
// would false-positive on this file's own prose comments) are covered by
// src/styles/__tests__/noAnimatedBlur.test.js.
