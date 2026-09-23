import { NOISE_GLSL } from './noise.glsl'

/** Shared by the surface and cloud layers (and Earth). */
export const planetVertex = /* glsl */ `
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
void main() {
  vObjPos = position;
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

/**
 * One surface shader for every world: either a photo texture sampled by UV
 * (uUseMap) or, as a fallback, fbm terrain between two palette colours;
 * latitude bands only apply in the fbm fallback. A real day/night terminator
 * from the one sun, limb darkening on textured worlds, optional real
 * night-side lights (uUseNight, Earth) or synthetic amber city noise
 * (uLights, Mercantile), meridian seams, and a hex shield sweep all layer on
 * top of either surface. uFlat switches to faceted normals.
 */
export const planetFragment = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uBand;
uniform vec3 uSunDir;
uniform float uTime;
uniform int uOctaves;
uniform float uBandFreq;
uniform float uBandSpeed;
uniform float uLights;
uniform float uSeams;
uniform float uShield;
uniform float uFlat;
uniform sampler2D uMap;
uniform float uUseMap;
uniform vec3 uTint;
uniform sampler2D uNightMap;
uniform float uUseNight;
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
${NOISE_GLSL}

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.73))), p.x);
}

float hexEdge(vec2 uv) {
  vec2 r = vec2(1.0, 1.73);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return smoothstep(0.42, 0.5, hexDist(g));
}

void main() {
  vec3 n = normalize(vWorldNormal);
  if (uFlat > 0.5) n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  vec3 sp = normalize(vObjPos);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  float day = smoothstep(-0.12, 0.4, dot(n, normalize(uSunDir)));

  vec3 col;
  float litFactor;
  if (uUseMap > 0.5) {
    col = texture2D(uMap, vUv).rgb * uTint;
    // Realism comes from rotation only on textured worlds — no fbm morph —
    // plus limb darkening so the terminator and grazing edges read as a sphere.
    day *= mix(0.75, 1.0, pow(max(dot(n, viewDir), 0.0), 0.35));
    // Textured worlds are photo albedo already — never multiply past it, so
    // the day side reads as lit terrain, not a blown-out wash.
    litFactor = 0.02 + 0.95 * day;
  } else {
    float f = fbm(sp * 2.2 + vec3(0.0, uTime * 0.01, 0.0), uOctaves);
    float bands = sin(sp.y * uBandFreq + f * 1.2 + uTime * uBandSpeed) * 0.5 + 0.5;
    col = mix(uBottom, uTop, smoothstep(-0.4, 0.6, f));
    col = mix(col, uBand, smoothstep(0.55, 0.95, bands) * 0.55 * step(0.001, uBandFreq));
    litFactor = mix(0.035, 1.05, day);
  }

  vec3 lit = col * litFactor;

  if (uUseNight > 0.5) {
    vec3 nightCol = texture2D(uNightMap, vUv).rgb;
    lit += nightCol * (1.0 - day) * 1.6;
  }

  if (uLights > 0.0) {
    float city = smoothstep(0.72, 0.9, snoise(sp * 38.0)) * (1.0 - day) * uLights;
    lit += vec3(0.91, 0.58, 0.16) * city * 1.6;
  }

  if (uSeams > 0.5) {
    float lon = fract(atan(sp.z, sp.x) / 6.2831853 * 8.0);
    float seam = 1.0 - smoothstep(0.0, 0.02, min(lon, 1.0 - lon));
    lit += uBand * seam * (0.25 + 0.5 * day);
  }

  if (uShield > 0.0 && uShield < 1.0) {
    float front = mix(-1.2, 1.2, uShield);
    float sweep = 1.0 - smoothstep(0.0, 0.18, abs(sp.y - front));
    float edge = hexEdge(vec2(atan(sp.z, sp.x) * 3.0, sp.y * 6.0));
    lit += vec3(0.62, 0.71, 0.74) * sweep * edge * 1.2;
  }

  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  lit += mix(uTop, uTint, step(0.5, uUseMap)) * rim * 0.25 * day;

  gl_FragColor = vec4(lit, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
