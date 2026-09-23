import { NOISE_GLSL } from './noise.glsl'

/** Drifting cloud layer (uses planetVertex). */
export const cloudsFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform float uTime;
uniform int uOctaves;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
${NOISE_GLSL}
void main() {
  vec3 sp = normalize(vObjPos);
  float c = fbm(sp * 3.0 + vec3(uTime * 0.02, 0.0, 0.0), uOctaves);
  float a = smoothstep(0.1, 0.5, c) * 0.5;
  float day = smoothstep(-0.1, 0.4, dot(normalize(vWorldNormal), normalize(uSunDir)));
  gl_FragColor = vec4(vec3(0.92, 0.95, 0.94) * (0.08 + 0.92 * day), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
