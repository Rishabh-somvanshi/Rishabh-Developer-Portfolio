/**
 * Warp streaks around the camera: each segment's back end sits at aBaseZ
 * (scrolling toward the viewer over time), its front end stretches uLen
 * further forward. Local space is the camera's (−z ahead).
 */
export const warpVertex = /* glsl */ `
attribute float aHead;
attribute float aBaseZ;
uniform float uTime;
uniform float uSpeed;
uniform float uLen;
varying float vHead;
void main() {
  vHead = aHead;
  float z = -5.0 - mod(-aBaseZ - 5.0 - uTime * uSpeed, 115.0);
  z += aHead * uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, z, 1.0);
}
`

export const warpFragment = /* glsl */ `
uniform float uOpacity;
varying float vHead;
void main() {
  gl_FragColor = vec4(vec3(0.93), vHead * uOpacity);
  #include <colorspace_fragment>
}
`
