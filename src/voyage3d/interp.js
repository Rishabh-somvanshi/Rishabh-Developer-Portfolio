/** Clamp to [0, 1]. */
export const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

/**
 * Piecewise-linear map, clamped at both ends — framer-motion's useTransform,
 * for plain numbers read inside useFrame. `input` must be ascending.
 */
export function interp(v, input, output) {
  const last = input.length - 1
  if (v <= input[0]) return output[0]
  if (v >= input[last]) return output[last]
  for (let i = 1; i <= last; i++) {
    if (v <= input[i]) {
      const t = (v - input[i - 1]) / (input[i] - input[i - 1])
      return output[i - 1] + (output[i] - output[i - 1]) * t
    }
  }
  return output[last]
}
