/** Fresnel halo on a slightly larger back-faced sphere; brighter on the day side. */
export const atmosphereVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const atmosphereFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform vec3 uSunDir;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(vN, vV)), 4.0);
  float lit = smoothstep(-0.3, 0.5, dot(vN, normalize(uSunDir)));
  float a = f * uIntensity * (0.25 + 0.75 * lit);
  gl_FragColor = vec4(uColor * a, a);
  #include <colorspace_fragment>
}
`
