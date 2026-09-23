export const ringVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const ringFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
varying vec3 vPos;
void main() {
  float t = (length(vPos.xy) - uInner) / (uOuter - uInner);
  float bands = 0.55 + 0.25 * sin(t * 40.0) + 0.2 * sin(t * 7.0);
  float a = bands * smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.9, t) * 0.55;
  gl_FragColor = vec4(uColor * 0.85, a);
  #include <colorspace_fragment>
}
`
