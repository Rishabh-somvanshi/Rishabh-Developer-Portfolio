#!/usr/bin/env node
/**
 * Static (no-browser) half of the Task 11 acceptance-criteria audit.
 *
 * `scripts/audit.js` needs a live document / computed styles and must be
 * pasted into DevTools — see docs/VERIFICATION.md for that half. This script
 * covers everything checkable by reading the *built* output in `dist/`
 * directly, so it can run in CI with no browser at all.
 *
 * Checks:
 *   1. Built CSS: rules with `filter: blur(...)` (must be 0), rules with
 *      `backdrop-filter` (must be 0), rules with `animation: ... infinite`
 *      (reported, not a failure — the voyage is meant to move), and whether
 *      any single rule combines a blur with an animation (must be none).
 *   2. Built CSS: at least one `@media (prefers-reduced-motion: reduce)`
 *      block exists, and at least one of them zeroes out animation with a
 *      wildcard `animation: none !important` rule.
 *   3. dist/index.html vs backup/live-2026-07-15/index.html: <meta> tags
 *      must be identical, so the Open Graph preview card for links already
 *      pasted into job applications doesn't change out from under them.
 *   4. Bundle budgets: the entry chunk and the voyage shell never contain
 *      three.js; the 3D world chunk is ≤ 300 KB gzipped; the entry chunk is
 *      smaller (gzipped) than the pre-rebuild live bundle.
 *
 * Usage: node scripts/audit-static.mjs   (run after `npm run build`)
 * Exits non-zero if any check fails, so it's usable as a CI gate.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const distAssetsDir = join(distDir, 'assets')
const distIndexPath = join(distDir, 'index.html')
const backupIndexPath = join(root, 'backup', 'live-2026-07-15', 'index.html')

let failed = false
const fail = (msg) => {
  failed = true
  console.log(`  FAIL: ${msg}`)
}
const pass = (msg) => console.log(`  PASS: ${msg}`)

console.log('=== Task 11 static audit (no browser) ===\n')

if (!existsSync(distDir)) {
  console.log(`FAIL: ${distDir} does not exist. Run "npm run build" first.`)
  process.exit(1)
}

/* ---------------------------------------------------------------------- *
 * 1 & 2. Built CSS checks
 * ---------------------------------------------------------------------- */

/**
 * Split a stylesheet into { selector, body } pairs, ignoring at-rule
 * preludes (@media, @font-face, @keyframes, ...). Mirrors the approach in
 * src/styles/__tests__/noAnimatedBlur.test.js: because the regex only
 * matches a brace pair with no further braces inside it, it naturally
 * flattens nested at-rules (e.g. rules inside @media) down to their leaf
 * selector + declaration body, whether the source is pretty-printed or
 * minified onto one line.
 */
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

/**
 * Extract every reduced-motion block by scanning balanced braces, so a
 * regex spanning to the last closing brace can't accidentally swallow
 * unrelated rules that follow it in the file.
 */
function reducedMotionBlocks(source) {
  const blocks = []
  const opener = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g
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
    blocks.push(source.slice(start, i - 1))
  }
  return blocks
}

// `filter:` but not `backdrop-filter:` (which also contains the substring
// "filter:" and is checked separately below).
const BLUR_RE = /(?<!-)filter:\s*[^;]*blur\(/
const BACKDROP_RE = /backdrop-filter:/
const ANIMATION_RE = /animation:/
const INFINITE_ANIMATION_RE = /animation:\s*[^;]*infinite/

if (!existsSync(distAssetsDir)) {
  fail(`${distAssetsDir} does not exist — build produced no assets directory`)
} else {
  const cssFiles = readdirSync(distAssetsDir).filter((f) => f.endsWith('.css'))

  if (cssFiles.length === 0) {
    fail(`no .css files found in ${distAssetsDir}`)
  } else {
    console.log(`CSS files analysed: ${cssFiles.join(', ')}\n`)

    let allRules = []
    let combinedSource = ''
    for (const file of cssFiles) {
      const source = readFileSync(join(distAssetsDir, file), 'utf8')
      combinedSource += `\n${source}`
      for (const r of rules(source)) allRules.push({ ...r, file })
    }

    const blurredRules = allRules.filter((r) => BLUR_RE.test(r.body))
    const backdropRules = allRules.filter((r) => BACKDROP_RE.test(r.body))
    const infiniteRules = allRules.filter((r) => INFINITE_ANIMATION_RE.test(r.body))
    const bothRules = blurredRules.filter((r) => ANIMATION_RE.test(r.body))

    console.log('-- CSS paint-cost checks --')
    console.log(`  rules with filter: blur(...)          : ${blurredRules.length}`)
    console.log(`  rules with backdrop-filter             : ${backdropRules.length}`)
    console.log(`  rules with animation: ... infinite     : ${infiniteRules.length} (informational — non-zero is expected, the voyage moves)`)
    console.log(`  rules combining a blur with an animation: ${bothRules.length}`)
    console.log()

    if (blurredRules.length === 0) {
      pass('blurred rule count is 0')
    } else {
      fail(`expected 0 rules with filter: blur(...), found ${blurredRules.length}: ${blurredRules.map((r) => `${r.file}:${r.selector}`).join(', ')}`)
    }

    if (backdropRules.length === 0) {
      pass('backdrop-filter rule count is 0')
    } else {
      fail(`expected 0 rules with backdrop-filter, found ${backdropRules.length}: ${backdropRules.map((r) => `${r.file}:${r.selector}`).join(', ')}`)
    }

    if (bothRules.length === 0) {
      pass('no rule combines a blur with an animation')
    } else {
      fail(`${bothRules.length} rule(s) combine a blur with an animation: ${bothRules.map((r) => `${r.file}:${r.selector}`).join(', ')}`)
    }

    console.log('\n-- reduced-motion checks --')
    const blocks = reducedMotionBlocks(combinedSource)
    if (blocks.length === 0) {
      fail('no @media (prefers-reduced-motion: reduce) block found in built CSS')
    } else {
      pass(`${blocks.length} @media (prefers-reduced-motion: reduce) block(s) found`)
      const wildcard = blocks.some((b) =>
        /(^|[\s,{])\*\s*,[\s\S]*?animation:\s*none\s*!important/.test(b),
      )
      if (wildcard) {
        pass('a wildcard "*, ... animation: none !important" rule exists under reduced motion')
      } else {
        fail('no wildcard "*, ... animation: none !important" rule found under reduced motion')
      }
    }
  }
}

/* ---------------------------------------------------------------------- *
 * 3. Meta tag parity between dist/index.html and the live backup
 * ---------------------------------------------------------------------- */

console.log('\n-- meta tag parity (dist/index.html vs backup/live-2026-07-15/index.html) --')

if (!existsSync(distIndexPath)) {
  fail(`${distIndexPath} does not exist`)
} else if (!existsSync(backupIndexPath)) {
  fail(`${backupIndexPath} does not exist`)
} else {
  const extractMeta = (html) => [...html.matchAll(/<meta[^>]*>/g)].map((m) => m[0])

  const backupMeta = extractMeta(readFileSync(backupIndexPath, 'utf8'))
  const distMeta = extractMeta(readFileSync(distIndexPath, 'utf8'))

  const backupSorted = [...backupMeta].sort()
  const distSorted = [...distMeta].sort()

  if (JSON.stringify(backupSorted) === JSON.stringify(distSorted)) {
    pass(`meta tags unchanged (${distMeta.length} tags)`)
  } else {
    fail('meta tags differ between dist/index.html and backup/live-2026-07-15/index.html')
    const backupSet = new Set(backupSorted)
    const distSet = new Set(distSorted)
    const onlyInBackup = backupSorted.filter((t) => !distSet.has(t))
    const onlyInDist = distSorted.filter((t) => !backupSet.has(t))
    if (onlyInBackup.length) {
      console.log('    only in backup/live-2026-07-15/index.html:')
      for (const t of onlyInBackup) console.log(`      ${t}`)
    }
    if (onlyInDist.length) {
      console.log('    only in dist/index.html:')
      for (const t of onlyInDist) console.log(`      ${t}`)
    }
  }
}

/* ---------------------------------------------------------------------- *
 * 4. Bundle budgets
 * ---------------------------------------------------------------------- */

console.log('\n-- bundle budgets --')

const WORLD_BUDGET = 300 * 1024
const THREE_MARKER = 'WebGLRenderer' // survives minification: it's a class name string three.js uses
const baselinePath = join(root, 'backup', 'live-2026-07-15', 'assets', 'index-X_nUHHwl.js')
const gz = (file) => gzipSync(readFileSync(file)).length
const kb = (n) => `${(n / 1024).toFixed(1)} KB`

if (existsSync(distAssetsDir) && existsSync(distIndexPath)) {
  const jsFiles = readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'))
  const entryName = (readFileSync(distIndexPath, 'utf8').match(/src="\/?assets\/([^"]+\.js)"/) || [])[1]
  const withThree = jsFiles.filter((f) => readFileSync(join(distAssetsDir, f), 'utf8').includes(THREE_MARKER))
  const shell = jsFiles.find((f) => f.startsWith('Journey-'))
  const world = jsFiles.find((f) => f.startsWith('World-'))

  if (!entryName) {
    fail('could not find the entry <script> in dist/index.html')
  } else if (!existsSync(join(distAssetsDir, entryName))) {
    fail(`entry chunk ${entryName} referenced by dist/index.html is missing from dist/assets`)
  } else if (withThree.includes(entryName)) {
    fail(`entry chunk ${entryName} contains three.js`)
  } else {
    pass(`entry chunk ${entryName} is three-free`)
  }

  if (!shell) fail('no Journey-*.js chunk: the voyage is not lazy-loaded')
  else if (withThree.includes(shell)) fail(`voyage shell ${shell} contains three.js`)
  else pass(`voyage shell ${shell} is three-free (${kb(gz(join(distAssetsDir, shell)))} gz)`)

  if (!world) {
    fail('no World-*.js chunk: the 3D world is not lazy-loaded')
  } else {
    // three.js may be split into a vendor chunk that only the world imports; count every three-bearing chunk.
    const worldTotal = [...new Set([world, ...withThree])].reduce((s, f) => s + gz(join(distAssetsDir, f)), 0)
    if (worldTotal <= WORLD_BUDGET) pass(`3D world ${kb(worldTotal)} gz ≤ ${kb(WORLD_BUDGET)}`)
    else fail(`3D world ${kb(worldTotal)} gz exceeds ${kb(WORLD_BUDGET)}`)
  }

  if (entryName && existsSync(join(distAssetsDir, entryName)) && existsSync(baselinePath)) {
    const now = gz(join(distAssetsDir, entryName))
    const before = gz(baselinePath)
    if (now < before) pass(`résumé entry ${kb(now)} gz < pre-rebuild ${kb(before)} gz`)
    else fail(`résumé entry ${kb(now)} gz is not smaller than pre-rebuild ${kb(before)} gz`)
  } else if (entryName && existsSync(join(distAssetsDir, entryName))) {
    fail(`baseline ${baselinePath} missing`)
  }
} else {
  fail('bundle budgets skipped: dist/assets or dist/index.html missing — run "npm run build" first')
}

/* ---------------------------------------------------------------------- *
 * Summary
 * ---------------------------------------------------------------------- */

console.log('\n=== Summary ===')
if (failed) {
  console.log('FAIL — one or more checks above failed. See "FAIL:" lines.')
  process.exit(1)
} else {
  console.log('PASS — all static checks passed.')
  process.exit(0)
}
