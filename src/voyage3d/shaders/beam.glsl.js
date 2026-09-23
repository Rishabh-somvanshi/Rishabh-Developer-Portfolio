/** Pulsar beam: brightest at the apex (the star), fading along the cone. */
export const beamVertex = /* glsl */ `
uniform float uHeight;
varying float vY;
void main() {
  vY = position.y / uHeight + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const beamFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vY;
void main() {
  gl_FragColor = vec4(uColor * 1.4, pow(vY, 1.5) * uOpacity * 0.6);
}
`
