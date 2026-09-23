import { CatmullRomCurve3, Vector3 } from 'three'

/**
 * Camera position and look-at splines through the stations. CatmullRomCurve3
 * maps t uniformly over its points (index = t · (n − 1)) whatever the curve
 * type, so station i sits exactly at t = i / (n − 1). Centripetal avoids
 * loops and overshoot on uneven station spacing.
 */
export function buildCurves(stations) {
  const points = (key) => stations.map((s) => new Vector3(...s[key]))
  return {
    position: new CatmullRomCurve3(points('position'), false, 'centripetal'),
    target: new CatmullRomCurve3(points('target'), false, 'centripetal'),
  }
}
