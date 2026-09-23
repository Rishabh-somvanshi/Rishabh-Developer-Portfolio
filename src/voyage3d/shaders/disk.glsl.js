/**
 * Accretion disk: hotter (whiter) toward the horizon, streaked, and brighter
 * on the side turning toward the viewer (relativistic beaming, stylised).
 * uUpperOnly draws just the top half, for the lensed far side of the disk.
 * Values above 1 are intentional: the bloom pass picks them up.
 */
export const diskVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const diskFragment = /* glsl */ `
uniform float uTime;
uniform float uInner;
uniform float uOuter;
uniform float uUpperOnly;
uniform float uOpacity;
varying vec3 vPos;
void main() {
  if (uUpperOnly > 0.5 && vPos.y < 0.0) discard;
  float r = length(vPos.xy);
  float t = (r - uInner) / (uOuter - uInner);
  float ang = atan(vPos.y, vPos.x);
  float streaks = 0.6 + 0.4 * sin(ang * 12.0 - uTime * 1.5 + r * 1.3);
  float temp = 1.0 - t;
  vec3 col = mix(vec3(0.91, 0.45, 0.12), vec3(1.0, 0.86, 0.62), pow(temp, 1.5));
  float doppler = 1.0 + 0.6 * sin(ang - 0.4);
  float a = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.6, t) * streaks * uOpacity;
  gl_FragColor = vec4(col * doppler * (0.35 + temp * 0.9), a * 0.85);
  #include <colorspace_fragment>
}
`
