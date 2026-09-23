export const starsVertex = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aAmber;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;
varying float vAmber;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vAlpha = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 0.2) + aPhase * 6.2831);
  vAmber = aAmber;
  gl_PointSize = clamp(aSize * uPixelRatio * (220.0 / -mv.z), 0.0, 6.0 * uPixelRatio);
}
`

export const starsFragment = /* glsl */ `
varying float vAlpha;
varying float vAmber;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  vec3 col = mix(vec3(0.93), vec3(0.91, 0.58, 0.16), vAmber);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`
