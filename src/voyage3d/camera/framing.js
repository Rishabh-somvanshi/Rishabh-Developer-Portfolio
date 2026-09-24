/**
 * Fits 3D objects into DOM "slots": the empty boxes the text layer reserves
 * where the old SVG visuals sat. Reusing those boxes keeps every tuned
 * breakpoint — the 3D body simply lands where the SVG used to be.
 *
 * All cameras here look straight down −z, so projection is a pinhole:
 *   ndc.x = dx / (dz · tan(fov/2) · aspect),  ndc.y = dy / (dz · tan(fov/2))
 */
export const CAMERA_FOV = 30 // a 50° lens stretched off-centre planets into ovals on wide screens
export const FILL = 0.62 // body diameter as a share of its slot's height — matches the retired SVG planets (260/420)
export const FRAME_DISTANCE = 4.5 // camera distance from a framed body, in body radii

const tanHalf = (fov) => Math.tan(((fov * Math.PI) / 180) / 2)

export const MIN_HFOV = 26 // narrowest horizontal view, in degrees — portrait phones
const MAX_FOV = 55

/**
 * Vertical FOV for a viewport aspect. Landscape keeps CAMERA_FOV. A portrait
 * phone at 30° vertical sees only ~18° across, so the black hole and Earth
 * overflowed the screen edge-to-edge and ran under the HUD; there the lens
 * opens until the view is MIN_HFOV wide. Slot-framed worlds are unaffected —
 * frameBody rescales them to their slots for any lens.
 */
export function fovFor(aspect) {
  const needed = (2 * Math.atan(tanHalf(MIN_HFOV) / aspect) * 180) / Math.PI
  return Math.min(MAX_FOV, Math.max(CAMERA_FOV, needed))
}

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

/**
 * World-space height of a `px` screen-space move at `depth` in front of the
 * camera — how far to move the camera so a framed body follows a card that
 * slides up on a phone (useOverflowShift). Negative px = up the screen.
 */
export function pxToWorldY(px, viewportH, depth, fov) {
  return (px / viewportH) * 2 * depth * tanHalf(fov)
}

/** Where a world's slot is before the DOM has been measured (mirrors .world-stage). */
export function defaultSlot(flip, viewport) {
  const narrow = viewport.w < 900
  const size = Math.min(viewport.w * 0.34, narrow ? 260 : 440)
  if (narrow) return { x: (viewport.w - size) / 2, y: viewport.h * 0.12, w: size, h: size }
  const cx = flip ? viewport.w * 0.75 : viewport.w * 0.25
  return { x: cx - size / 2, y: (viewport.h - size) / 2, w: size, h: size }
}
