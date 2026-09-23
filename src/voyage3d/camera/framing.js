/**
 * Fits 3D objects into DOM "slots": the empty boxes the text layer reserves
 * where the old SVG visuals sat. Reusing those boxes keeps every tuned
 * breakpoint — the 3D body simply lands where the SVG used to be.
 *
 * All cameras here look straight down −z, so projection is a pinhole:
 *   ndc.x = dx / (dz · tan(fov/2) · aspect),  ndc.y = dy / (dz · tan(fov/2))
 */
export const CAMERA_FOV = 50
export const FILL = 0.8 // body diameter as a share of its slot's height (room for aura/ring)
export const FRAME_DISTANCE = 4.5 // camera distance from a framed body, in body radii

const tanHalf = (fov) => Math.tan(((fov * Math.PI) / 180) / 2)

/** Slot centre in NDC (−1..1, y up) and half the slot's height in NDC units. */
export function slotToNdc(slot, viewport) {
  return {
    x: ((slot.x + slot.w / 2) / viewport.w) * 2 - 1,
    y: 1 - ((slot.y + slot.h / 2) / viewport.h) * 2,
    halfH: slot.h / viewport.h,
  }
}

/**
 * A camera station that shows `body` centred in `slot`. The distance is fixed
 * (FRAME_DISTANCE radii) so the flight path stays stable across screen sizes;
 * the body is scaled instead to fill the slot.
 */
export function frameBody(body, slot, viewport, fov = CAMERA_FOV) {
  const t = tanHalf(fov)
  const aspect = viewport.w / viewport.h
  const { x: sx, y: sy, halfH } = slotToNdc(slot, viewport)
  const dist = FRAME_DISTANCE * body.radius
  const ox = -sx * dist * t * aspect
  const oy = -sy * dist * t
  const [cx, cy, cz] = body.center
  return {
    position: [cx + ox, cy + oy, cz + dist],
    target: [cx + ox, cy + oy, cz],
    scale: (halfH * FILL * dist * t) / body.radius,
  }
}

/** World position (and radius) that puts an object in `slot`, `depth` in front of a −z-facing camera. */
export function placeInSlot(cameraPosition, slot, viewport, depth, fov = CAMERA_FOV) {
  const t = tanHalf(fov)
  const aspect = viewport.w / viewport.h
  const { x: sx, y: sy, halfH } = slotToNdc(slot, viewport)
  const [px, py, pz] = cameraPosition
  return {
    position: [px + sx * depth * t * aspect, py + sy * depth * t, pz - depth],
    radius: halfH * FILL * depth * t,
  }
}

/** Where a world's slot is before the DOM has been measured (mirrors .world-stage). */
export function defaultSlot(flip, viewport) {
  const narrow = viewport.w < 900
  const size = Math.min(viewport.w * 0.34, narrow ? 260 : 440)
  if (narrow) return { x: (viewport.w - size) / 2, y: viewport.h * 0.12, w: size, h: size }
  const cx = flip ? viewport.w * 0.75 : viewport.w * 0.25
  return { x: cx - size / 2, y: (viewport.h - size) / 2, w: size, h: size }
}
