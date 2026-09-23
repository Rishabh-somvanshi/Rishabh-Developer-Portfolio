/**
 * Textured cloud layer (uses planetVertex). Realism comes from the layer's
 * own slow rotation (see Planet3D), not a time-driven shader morph — alpha
 * comes from the cloud map's luminance, day/night dimming from the one sun.
 */
export const cloudsFragment = /* glsl */ `
uniform sampler2D uCloudMap;
uniform vec3 uSunDir;
varying vec3 vWorldNormal;
varying vec2 vUv;
void main() {
  vec3 tex = texture2D(uCloudMap, vUv).rgb;
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  float a = smoothstep(0.15, 0.55, lum) * 0.65;
  float day = smoothstep(-0.1, 0.4, dot(normalize(vWorldNormal), normalize(uSunDir)));
  gl_FragColor = vec4(vec3(0.92, 0.95, 0.94) * (0.08 + 0.92 * day), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
