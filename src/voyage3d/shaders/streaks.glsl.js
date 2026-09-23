/** Line segments whose head end is bright and whose tail end fades to nothing. */
export const streaksVertex = /* glsl */ `
attribute float aHead;
attribute float aAmber;
varying float vHead;
varying float vAmber;
void main() {
  vHead = aHead;
  vAmber = aAmber;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const streaksFragment = /* glsl */ `
uniform float uOpacity;
varying float vHead;
varying float vAmber;
void main() {
  vec3 col = mix(vec3(0.93), vec3(0.96, 0.66, 0.24), vAmber);
  gl_FragColor = vec4(col, vHead * vHead * uOpacity);
  #include <colorspace_fragment>
}
`
