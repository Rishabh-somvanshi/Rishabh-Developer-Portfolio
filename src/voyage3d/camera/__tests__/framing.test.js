import { describe, it, expect } from 'vitest'
import { frameBody, placeInSlot, slotToNdc, defaultSlot, CAMERA_FOV, FILL } from '../framing'

const t = Math.tan(((CAMERA_FOV * Math.PI) / 180) / 2)
const viewport = { w: 1280, h: 800 }
const aspect = viewport.w / viewport.h

/** Pinhole projection for a camera looking straight down −z. */
function project(point, cam) {
  const dz = cam[2] - point[2]
  return { x: (point[0] - cam[0]) / (dz * t * aspect), y: (point[1] - cam[1]) / (dz * t), dz }
}

describe('frameBody', () => {
  const body = { center: [10, -4, -100], radius: 8 }
  const slot = { x: 100, y: 200, w: 400, h: 400 }

  it('projects the body centre onto the slot centre', () => {
    const { position } = frameBody(body, slot, viewport)
    const ndc = slotToNdc(slot, viewport)
    const got = project(body.center, position)
    expect(got.x).toBeCloseTo(ndc.x)
    expect(got.y).toBeCloseTo(ndc.y)
  })

  it('looks straight down −z', () => {
    const { position, target } = frameBody(body, slot, viewport)
    expect(target[0]).toBeCloseTo(position[0])
    expect(target[1]).toBeCloseTo(position[1])
    expect(target[2]).toBeLessThan(position[2])
  })

  it('scales the body so its diameter fills FILL of the slot height', () => {
    const { position, scale } = frameBody(body, slot, viewport)
    const dz = position[2] - body.center[2]
    const projectedRadius = (body.radius * scale) / (dz * t)
    expect(projectedRadius).toBeCloseTo(slotToNdc(slot, viewport).halfH * FILL)
  })
})

describe('placeInSlot', () => {
  it('puts the object where the slot is, at the given depth', () => {
    const cam = [0, 0, -410]
    const slot = { x: 900, y: 100, w: 300, h: 300 }
    const { position } = placeInSlot(cam, slot, viewport, 60)
    const got = project(position, cam)
    const ndc = slotToNdc(slot, viewport)
    expect(got.dz).toBeCloseTo(60)
    expect(got.x).toBeCloseTo(ndc.x)
    expect(got.y).toBeCloseTo(ndc.y)
  })
})

describe('defaultSlot', () => {
  it('uses the left half for unflipped worlds and the right half for flipped ones on desktop', () => {
    const left = defaultSlot(false, viewport)
    const right = defaultSlot(true, viewport)
    expect(left.x + left.w / 2).toBeLessThan(viewport.w / 2)
    expect(right.x + right.w / 2).toBeGreaterThan(viewport.w / 2)
  })
  it('centres the slot near the top on narrow screens', () => {
    const phone = { w: 375, h: 667 }
    const s = defaultSlot(false, phone)
    expect(s.x + s.w / 2).toBeCloseTo(phone.w / 2)
    expect(s.y).toBeLessThan(phone.h / 3)
  })
})
