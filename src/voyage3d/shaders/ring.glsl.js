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
uniform sampler2D uMap;
uniform float uUseMap;
varying vec3 vPos;
void main() {
  float t = clamp((length(vPos.xy) - uInner) / (uOuter - uInner), 0.0, 1.0);
  vec3 col;
  float a;
  if (uUseMap > 0.5) {
    // The source ring texture is a horizontal radial strip: u = radius, v is flat.
    vec4 tex = texture2D(uMap, vec2(t, 0.5));
    col = tex.rgb * uColor;
    a = tex.a * smoothstep(0.0, 0.03, t) * smoothstep(1.0, 0.97, t);
  } else {
    float bands = 0.55 + 0.25 * sin(t * 40.0) + 0.2 * sin(t * 7.0);
    col = uColor * 0.85;
    a = bands * smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.9, t) * 0.55;
  }
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`
