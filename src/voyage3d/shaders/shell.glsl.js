/** Supernova shockwave: an expanding fresnel shell, brightest at its rim. */
export const shellVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const shellFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(vN, vV)), 3.0);
  gl_FragColor = vec4(uColor * 1.6, f * uOpacity);
  #include <colorspace_fragment>
}
`
