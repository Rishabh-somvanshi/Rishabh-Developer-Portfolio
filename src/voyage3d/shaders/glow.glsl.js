/** Soft radial glow. uRing = 0 → a disc falling off from the centre; uRing > 0 → a ring peaking at that radius (0..0.5 of the quad). */
export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uRing;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5);
  float k = (d - uRing) / 0.05; // signed, so square it by hand: a negative power base is NaN
  float a = uRing > 0.0
    ? exp(-k * k)
    : pow(smoothstep(0.5, 0.0, d), 2.0);
  gl_FragColor = vec4(uColor, a * uIntensity);
  #include <colorspace_fragment>
}
`
