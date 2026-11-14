'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** World-space position of the light source the water reflects (updated by the crystal's group). */
export const lightSource = { pos: new THREE.Vector3(0.6, 0.6, 0), strength: 1 };

/** How much of the ocean world is showing (0 = deep space, 1 = open sea). Written by Water, read by Sky. */
export const ocean = { amount: 0 };

/** Height of the mean sea level in world space. */
const SEA_LEVEL = -1.75;

/* ─── Shared GLSL: noise, the overcast sky, and the sea surface ──────────── */

const noiseGLSL = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }
`;

/** A low, heavy overcast: a cloud deck lit from behind, with mist sitting on the horizon. */
const skyGLSL = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uCloud;
  uniform vec3 uCloudDark;
  uniform vec3 uGlow;
  uniform vec3 uGlowDir;
  uniform float uGlowAmt;
  uniform float uTime;

  // the sky right at the horizon, without clouds (used for the sea's distance mist)
  vec3 horizonColor(vec3 d) {
    float g = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uGlowDir.x, 0.0, uGlowDir.z))), 0.0), 6.0);
    return uHorizon + uGlow * g * 0.35;
  }

  vec3 overcast(vec3 d) {
    float y = max(d.y, 0.0);
    vec3 col = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.42, y), 0.6));
    // cloud deck: the ray meets a high flat layer, so clouds stretch into bands toward the horizon
    vec2 uv = d.xz / (y + 0.055) * 0.55;
    uv.x *= 0.5;
    uv += vec2(uTime * 0.012, -uTime * 0.004);
    float c1 = fbm(uv * 1.15);
    float c2 = fbm(uv * 2.9 + vec2(5.2, 1.3));
    float cover = smoothstep(0.38, 0.78, c1 * 0.72 + c2 * 0.4);
    float band = smoothstep(0.0, 0.07, y) * (1.0 - 0.45 * smoothstep(0.35, 0.85, y));
    vec3 cloud = mix(uCloudDark, uCloud, smoothstep(0.35, 0.85, c2));
    col = mix(col, cloud, cover * band * 0.9);
    // the stone's light, glowing through the clouds behind it
    float gl = max(dot(d, uGlowDir), 0.0);
    col += uGlow * (pow(gl, 14.0) * 0.55 + pow(gl, 3.0) * 0.12) * uGlowAmt;
    // mist sitting on the horizon
    col = mix(col, horizonColor(d), exp(-y * 16.0) * 0.85);
    return col;
  }
`;

/**
 * The sea surface: a stack of directional waves with peaked crests (exp-sine), each one dragging the
 * next so they bunch up and break up like real swell. Octaves fade out with distance so the far sea
 * settles into a smooth mirror instead of shimmering.
 */
const seaGLSL = /* glsl */ `
  float sea(vec2 p, float t, float dist, int n, out vec2 g) {
    float h = 0.0;
    g = vec2(0.0);
    float amp = 0.6;
    float freq = 0.3;
    for (int i = 0; i < 18; i++) {
      if (i >= n) break;
      float fi = float(i);
      // mostly rolling in toward the viewer, spreading out with each finer octave
      float a = 1.5708 + sin(fi * 2.39 + 0.6) * (0.3 + fi * 0.11);
      vec2 d = vec2(cos(a), sin(a));
      float ph = dot(d, p) * freq - t * sqrt(9.8 * freq) * 0.42;
      float s = exp(sin(ph) - 1.0);
      float ds = s * cos(ph);
      // level of detail: drop a wave once it is too small to resolve at this distance
      float lod = clamp(6.2832 / freq / (0.006 * dist * (1.0 + dist * 0.33)) - 1.0, 0.0, 1.0);
      h += amp * s * lod;
      g += amp * ds * freq * d * lod;
      p -= d * ds * amp * 0.7;
      amp *= 0.73;
      freq *= 1.26;
    }
    return h;
  }
`;

/* ─── Sky: full-screen backdrop drawn behind everything ───────────────────── */

const skyVert = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vNdc;
  void main() {
    vUv = uv;
    vNdc = position.xy;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
const skyFrag = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uSpaceGlow;
  uniform vec3 uBottom;
  uniform float uAspect;
  uniform float uOcean;
  uniform mat4 uInvProj;
  uniform mat4 uCamWorld;
  varying vec2 vUv;
  varying vec2 vNdc;
  ${noiseGLSL}
  ${skyGLSL}
  void main() {
    // deep space, for the chapters away from the sea
    vec2 p = vUv - vec2(0.5, 0.62);
    p.x *= uAspect;
    vec3 space = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
    space += uSpaceGlow * exp(-dot(p, p) * 2.2);
    space += uSpaceGlow * 0.5 * exp(-pow((vUv.y - 0.45) * 7.0, 2.0));

    vec3 col = space;
    if (uOcean > 0.001) {
      vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
      vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
      col = mix(space, overcast(dir), uOcean);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Colours of the overcast sea world, shared by the sky and the water's reflections. */
function overcastUniforms(glow = 1) {
  return {
    uZenith: { value: new THREE.Color('#010832') },
    uHorizon: { value: new THREE.Color('#25385f') },
    uCloud: { value: new THREE.Color('#1c3468') },
    uCloudDark: { value: new THREE.Color('#030b2e') },
    uGlow: { value: new THREE.Color('#4a6699') },
    uGlowDir: { value: new THREE.Vector3(0, 0.1, -1) },
    uGlowAmt: { value: glow },
    uTime: { value: 0 },
  };
}

const glowDir = new THREE.Vector3();

export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTop: { value: new THREE.Color('#03091a') },
          uSpaceGlow: { value: new THREE.Color('#0a2350') },
          uBottom: { value: new THREE.Color('#00030b') },
          uAspect: { value: 1 },
          uOcean: { value: 0 },
          uInvProj: { value: new THREE.Matrix4() },
          uCamWorld: { value: new THREE.Matrix4() },
          ...overcastUniforms(),
        },
      }),
    [],
  );
  useFrame(({ size, camera, clock }) => {
    const u = material.uniforms;
    u.uAspect.value = size.width / size.height;
    u.uOcean.value = ocean.amount;
    u.uTime.value = clock.elapsedTime;
    u.uInvProj.value.copy(camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(camera.matrixWorld);
    glowDir.copy(lightSource.pos).sub(camera.position).normalize();
    u.uGlowDir.value.copy(glowDir);
  });
  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/* ─── Water: open sea under the overcast, reflecting the sky and the stone ── */

const waterVert = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  ${seaGLSL}
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float dist = length(w.xyz - cameraPosition);
    vec2 g;
    w.y += sea(w.xz, uTime, dist, 7, g);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const waterFrag = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uScatter;
  uniform vec3 uLightCol;
  uniform vec3 uLightPos;
  uniform float uLight;
  uniform float uOpacity;
  varying vec3 vWorld;
  ${noiseGLSL}
  ${skyGLSL}
  ${seaGLSL}
  void main() {
    float dist = length(vWorld - cameraPosition);
    vec2 g;
    float h = sea(vWorld.xz, uTime, dist, 18, g);
    vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 V = normalize(cameraPosition - vWorld);
    float ndv = max(dot(N, V), 0.0);

    // reflection of the overcast (Fresnel for water, F0 ≈ 0.02)
    float F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 refl = overcast(R);

    // the body of the water: near-black depths, with light scattering through the thin tops of the swell
    float crest = smoothstep(0.35, 1.1, h);
    // plus a little skylight coming back up out of the water on faces that tilt toward the viewer
    vec3 body = uDeep + uScatter * (0.35 + crest * (0.6 + 0.9 * pow(1.0 - ndv, 2.0)));
    body += uHorizon * 0.18 * smoothstep(0.75, 1.0, N.y) * (1.0 - ndv);
    vec3 col = mix(body, refl, F);

    // the stone's light: tight glints on the wave faces and a soft column on the water beneath it
    vec3 L = normalize(uLightPos - vWorld);
    float rl = max(dot(R, L), 0.0);
    // kept faint: the stone hangs low, so a strong mirror image would blow out the foreground
    col += uLightCol * pow(rl, 1500.0) * 0.6 * uLight;

    // mist: the far sea dissolves into the horizon haze
    float mist = 1.0 - exp(-max(dist - 6.0, 0.0) * 0.022);
    col = mix(col, horizonColor(-V), clamp(mist, 0.0, 1.0));
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * A ground plane that hugs the camera frustum: rows bunch up close to the viewer (where the swell is
 * big on screen) and spread out toward the horizon; each row is only as wide as the view needs.
 */
function seaGeometry(cols: number, rows: number) {
  const camZ = 7;
  const near = 0.3;
  const far = 170;
  const pos = new Float32Array((cols + 1) * (rows + 1) * 3);
  let k = 0;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const d = near + (far - near) * Math.pow(t, 2.1);
    const half = d * 1.25 + 3;
    for (let i = 0; i <= cols; i++) {
      pos[k++] = (i / cols - 0.5) * 2 * half;
      pos[k++] = 0;
      pos[k++] = camZ - d;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + cols + 1;
      index.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(index);
  return g;
}

export function Water({ opacity }: { opacity: { current: number } }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => seaGeometry(220, 240), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uDeep: { value: new THREE.Color('#02050d') },
          uScatter: { value: new THREE.Color('#0c2246') },
          uLightCol: { value: new THREE.Color('#9fd3ff') },
          uLightPos: { value: lightSource.pos },
          uLight: { value: 1 },
          uOpacity: { value: 0 },
          ...overcastUniforms(0.15),
        },
      }),
    [],
  );
  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uLight.value = lightSource.strength;
    u.uOpacity.value = opacity.current;
    glowDir.copy(lightSource.pos).sub(state.camera.position).normalize();
    u.uGlowDir.value.copy(glowDir);
    ocean.amount = opacity.current;
    mesh.current.visible = opacity.current > 0.003;
  });
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      position={[0, SEA_LEVEL, 0]}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}
