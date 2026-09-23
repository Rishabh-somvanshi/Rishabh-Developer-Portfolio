import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import { layoutFor, BODIES, SUN_DIR } from '../stations'
import { buildCurves } from '../curves'
import { SCENE_IDS } from '../../../data/voyage'

const PHONE_SLOT = { x: 143, y: 60, w: 88, h: 88 }
const MEASURES = {
  'desktop, unmeasured': { viewport: { w: 1280, h: 800 }, slots: {} },
  'phone, unmeasured': { viewport: { w: 375, h: 667 }, slots: {} },
  'phone, measured': {
    viewport: { w: 375, h: 667 },
    slots: { curo: PHONE_SLOT, mercantile: PHONE_SLOT, vault: PHONE_SLOT, porcelain: PHONE_SLOT },
  },
}

describe.each(Object.entries(MEASURES))('layoutFor — %s', (_, measure) => {
  const layout = layoutFor(measure)
  const curves = buildCurves(layout.stations)

  it('has one station per scene, in voyage order', () => {
    expect(layout.stations.map((s) => s.id)).toEqual(SCENE_IDS)
  })

  it('puts station i exactly at u = i / (n − 1)', () => {
    const n = layout.stations.length
    layout.stations.forEach((s, i) => {
      const p = curves.position.getPoint(i / (n - 1))
      expect(p.distanceTo(new Vector3(...s.position))).toBeLessThan(1e-6)
    })
  })

  it('never flies the camera into a body', () => {
    const radius = (id) => BODIES[id].radius * (layout.scales[id] ?? 1)
    const p = new Vector3()
    for (let k = 0; k <= 800; k++) {
      curves.position.getPoint(k / 800, p)
      for (const id of Object.keys(BODIES)) {
        const d = p.distanceTo(new Vector3(...BODIES[id].center))
        expect(d, `camera inside ${id} at u=${k / 800}`).toBeGreaterThan(radius(id) * 1.05)
      }
    }
  })
})

describe('twin lights placement', () => {
  it('uses defaults before measuring, and hides a visual the layout dropped', () => {
    expect(layoutFor(MEASURES['desktop, unmeasured']).twin.nova).not.toBeNull()
    expect(layoutFor(MEASURES['phone, measured']).twin.nova).toBeNull()
  })
})

describe('SUN_DIR', () => {
  it('is a unit vector', () => {
    expect(Math.hypot(...SUN_DIR)).toBeCloseTo(1)
  })
})
