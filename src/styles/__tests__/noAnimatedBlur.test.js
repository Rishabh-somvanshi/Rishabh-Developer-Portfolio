import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, extname } from 'node:path'

// Deliberately not `new URL('../journey.css', import.meta.url)`: under Vite,
// that exact literal pattern is statically rewritten into a dev-server asset
// URL (e.g. http://localhost:3000/...) instead of a file path, which breaks
// readFileSync in the jsdom test environment. Resolving via node:path avoids
// the special-cased syntax.
const journeyCssPath = join(dirname(fileURLToPath(import.meta.url)), '../journey.css')
const journeyCss = readFileSync(journeyCssPath, 'utf8')

const globalCssPath = join(dirname(fileURLToPath(import.meta.url)), '../global.css')
const globalCss = readFileSync(globalCssPath, 'utf8')

/** Split a stylesheet into { selector, body } pairs, ignoring at-rule preludes. */
function rules(source) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = re.exec(source))) {
    const selector = match[1].trim()
    if (selector.startsWith('@')) continue
    out.push({ selector, body: match[2] })
  }
  return out
}

describe('paint cost in stylesheets', () => {
  it('never animates a blurred element in journey.css', () => {
    const offenders = rules(journeyCss)
      .filter((r) => /filter:\s*[^;]*blur\(/.test(r.body) && /animation:/.test(r.body))
      .map((r) => r.selector)
    expect(offenders).toEqual([])
  })

  it('does not use backdrop-filter in journey.css or global.css', () => {
    const journeyOffenders = rules(journeyCss)
      .filter((r) => /backdrop-filter:/.test(r.body))
      .map((r) => `journey.css: ${r.selector}`)

    const globalOffenders = rules(globalCss)
      .filter((r) => /backdrop-filter:/.test(r.body))
      .map((r) => `global.css: ${r.selector}`)

    const allOffenders = [...journeyOffenders, ...globalOffenders]
    expect(allOffenders).toEqual([])
  })
})

// CSS is not the only place an animated blur can hide: framer-motion lets a
// component drive `filter: blur(...)` directly through a motion value in a
// JSX inline style, invisible to the rule scan above. Walk every .jsx file
// under src/ and fail if any of them do that.
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../../')

function listJsxFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) listJsxFiles(full, out)
    else if (extname(entry) === '.jsx') out.push(full)
  }
  return out
}

/**
 * Given source text and the index of the '(' that opens a call, return the
 * full balanced-paren call text, e.g. "useTransform(p, [...], [...])".
 * A plain regex can't do this reliably because the arguments themselves
 * contain parens/brackets.
 */
function extractBalancedCall(source, openParenIndex) {
  let depth = 0
  for (let i = openParenIndex; i < source.length; i++) {
    if (source[i] === '(') depth++
    else if (source[i] === ')') {
      depth--
      if (depth === 0) return source.slice(openParenIndex, i + 1)
    }
  }
  return source.slice(openParenIndex)
}

describe('no animated blur in JSX', () => {
  it('never drives filter: blur(...) through a motion value or inline style', () => {
    const offenders = []

    for (const file of listJsxFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      const relPath = relative(srcRoot, file).replace(/\\/g, '/')

      // Case 1: blur(...) passed as an argument to useTransform/useSpring/useMotionValue.
      const hookCallRe = /\b(useTransform|useSpring|useMotionValue)\s*\(/g
      let match
      while ((match = hookCallRe.exec(source))) {
        const openParenIndex = match.index + match[0].length - 1
        const call = extractBalancedCall(source, openParenIndex)
        if (/blur\(/.test(call)) {
          offenders.push(`${relPath}: ${match[1]}(...) animates a blur() value`)
        }
      }

      // Case 2: a literal blur() written straight into an inline `filter:` style.
      if (/filter:\s*[^,}\n]*blur\(/.test(source)) {
        offenders.push(`${relPath}: inline style sets filter to a blur()`)
      }
    }

    expect(offenders).toEqual([])
  })
})
