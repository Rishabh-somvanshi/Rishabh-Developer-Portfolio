import { NOISE_GLSL } from './noise.glsl'

export const nebulaVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const nebulaFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  vec2 p = vUv * 3.0;
  float n = snoise(vec3(p, uTime * 0.01)) * 0.5 + 0.5;
  float n2 = snoise(vec3(p * 2.3 + 7.0, uTime * 0.015)) * 0.5 + 0.5;
  float mask = smoothstep(0.55, 1.0, n * 0.7 + n2 * 0.5);
  float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x)
             * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
  // Bias the veil away from the screen's centre band, where the text cards
  // sit: fade it out toward vUv 0.5,0.5 and only let it show near the
  // plane's outer thirds, so no soft light shape sits directly behind copy.
  float centerDist = length(vUv - vec2(0.5));
  float centerBias = smoothstep(0.12, 0.42, centerDist);
  vec3 col = mix(vec3(0.91, 0.58, 0.16), vec3(0.44, 0.64, 0.6), n2);
  gl_FragColor = vec4(col, mask * edge * centerBias * 0.03);
  #include <colorspace_fragment>
}
`
