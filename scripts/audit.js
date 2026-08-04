/**
 * NOT a Node script. This is meant to be pasted into the DevTools console on
 * a built preview (`npm run build && npm run preview`), not run with `node
 * scripts/audit.js` — it needs a live `document` and computed styles from a
 * real render, which Node does not have. For the parts of this audit that
 * CAN run under Node against the built output on disk, see
 * `scripts/audit-static.mjs`.
 *
 * Paste into the DevTools console on a built preview to check the spec's
 * measurable acceptance criteria. Run once on `/` and once on `/#voyage`.
 */
;(() => {
  const all = [...document.querySelectorAll('*')]
  const infinite = all.filter((el) => {
    const cs = getComputedStyle(el)
    return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite'
  })
  const blurred = all.filter((el) => /blur\(/.test(getComputedStyle(el).filter))
  const backdrop = all.filter((el) => getComputedStyle(el).backdropFilter !== 'none')
  const both = blurred.filter((el) => getComputedStyle(el).animationName !== 'none')

  console.table({
    hash: location.hash || '(none)',
    nodes: all.length,
    scrollHeight: document.body.scrollHeight,
    infiniteAnimations: infinite.length,
    blurredElements: blurred.length,
    backdropFilters: backdrop.length,
    blurredAndAnimated: both.length,
  })
  return { infinite, blurred, backdrop, both }
})()
