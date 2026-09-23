/**
 * Scene position → camera spline parameter, in station units (station i at s = i).
 *
 * While a scene's stage is pinned the camera HOLDS its station (DRIFT = 0):
 * an earlier dwell crept it toward the next station while a card was pinned,
 * which slid framed planets out of their DOM slots underneath the text.
 * While the next scene scrolls in, it FLIES the rest of the way, eased. At
 * the moment the next scene's stage pins, the camera is exactly on its
 * station — there is never a blank frame, because the in-between is travel.
 */
export const DRIFT = 0

const smoothstep = (t) => t * t * (3 - 2 * t)

export function cameraS({ index, dwell, travel }, n) {
  const s = index + DRIFT * dwell + (1 - DRIFT) * smoothstep(travel)
  return Math.min(Math.max(s, 0), n - 1)
}

/** prefers-reduced-motion: hard cut to the next station halfway through the hand-over. */
export function cameraSReduced({ index, travel }, n) {
  return Math.min(index + (travel >= 0.5 ? 1 : 0), n - 1)
}

/** 0 at rest, 1 mid-flight — drives warp streaks between stations. */
export function travelFx({ travel }) {
  return Math.sin(Math.PI * travel)
}
