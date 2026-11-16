'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SHAPE_BRIGHTNESS, buildShapes, type LogoMask, type PortraitMask } from './shapes';
import { SHAPE_CHAPTER, sceneState } from './store';
import Crystal, { type PointerField } from './Crystal';
import { Sky, Water, lightSource, ocean } from './Environment';
import { EffectComposer, Bloom, ToneMapping, Noise } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

/* ─── Per-chapter staging ──────────────────────────────────────────────────
   [x, y, z, scale] for where each shape sits relative to the copy. */
const STAGE_DESKTOP: [number, number, number, number][] = [
  [0, 0.55, 0, 0.62], // intro — stone cube balanced on its corner, centred
  [2.1, -0.05, 0, 0.8], // manifesto — Samir's portrait, copy on the left
  [0, 0.1, -3.2, 1.35], // work — galaxy behind the cards
  [2.15, 0.05, 0, 0.92], // principles — a software tool per principle
  [2.15, 0, 0, 0.8], // journey — company logos, clear of the company name
  [2.2, 0, 0, 0.78], // vision — globe, then one figure per horizon
  [0, 1.05, -1.2, 0.78], // contact — portal, above the title so its ring never crosses the label
];
const STAGE_MOBILE: [number, number, number, number][] = [
  [0, 1.0, 0, 0.42],
  [0, 1.55, -1, 0.5],
  [0, 0.3, -3, 0.9],
  [0, 1.68, -1.5, 0.5],
  [0, 1.72, -1.5, 0.44],
  [0, 1.5, -1.5, 0.6],
  [0, 1.4, -1.5, 0.7],
];
const HALO = [1, 0.06, 0.35, 0.4, 0.3, 0.45, 0.85]; // almost none behind the portrait
const OCEAN = [1, 0, 0, 0, 0, 0, 0.75];
// On phones the shapes sit behind the copy, so dim them in the text-heavy chapters
const DIM_MOBILE = [1, 0.95, 0.45, 0.32, 0.32, 0.32, 0.85]; // portrait sits above the About copy, so it stays bright

/* Each shape's own motion, as a rotation matrix of time (indices = flat shape list). */
const tmpE = new THREE.Euler();
const tmpM = new THREE.Matrix4();
const tmpM2 = new THREE.Matrix4();
function shapeRotation(i: number, t: number, out: THREE.Matrix3) {
  switch (i) {
    case 0: tmpE.set(Math.sin(t * 0.3) * 0.12, t * 0.22, 0); break;
    case 1: tmpE.set(Math.sin(t * 0.4) * 0.03, Math.sin(t * 0.3) * 0.05, 0); break; // portrait faces the visitor, barely breathing
    case 2:
      tmpM.makeRotationFromEuler(tmpE.set(1.08, 0, 0.28));
      tmpM2.makeRotationY(t * 0.06);
      return out.setFromMatrix4(tmpM.multiply(tmpM2));
    case 3: tmpE.set(Math.sin(t * 0.4) * 0.1, -0.3 + Math.sin(t * 0.3) * 0.32, 0); break; // </>
    // Journey logos face the viewer and sway so the 3D depth shows
    case 4:
    case 5:
    case 6: tmpE.set(Math.sin(t * 0.35 + i) * 0.1, -0.32 + Math.sin(t * 0.3 + i) * 0.38, 0); break;
    case 7: // globe
      tmpM.makeRotationZ(0.38);
      tmpM2.makeRotationY(t * 0.14);
      return out.setFromMatrix4(tmpM.multiply(tmpM2));
    default: tmpE.set(Math.sin(t * 0.3) * 0.25, Math.sin(t * 0.2) * 0.3, t * 0.12);
  }
  return out.setFromMatrix4(tmpM.makeRotationFromEuler(tmpE));
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The stage positions are tuned for a 16:10 window. Shapes that sit beside the copy follow the
 * window's width: on a wider screen they move further right, and on a narrower one they shrink, so
 * they never slide in under the text. `fit` is the window's aspect ratio relative to 16:10.
 */
function fitStage([x, y, z, sc]: [number, number, number, number], fit: number): [number, number, number, number] {
  if (Math.abs(x) < 1) return [x, y, z, sc];
  return [x * Math.min(1.35, Math.max(0.8, fit)), y, z, sc * Math.min(1, Math.max(0.72, fit))];
}

/** Particle size per shape (flat shape list). The portrait uses fine grain so the face reads. */
const SHAPE_SIZE: Record<number, number> = { 1: 0.44 };

/* ─── Morphing particle field ──────────────────────────────────────────── */

const morphVert = /* glsl */ `
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  uniform mat3 uRotA;
  uniform mat3 uRotB;
  uniform float uSizeA;
  uniform float uSizeB;
  uniform vec3 uPointer;
  uniform float uForce;
  uniform float uRadius;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aRand;
  attribute float aLumA;
  attribute float aLumB;
  varying float vA;
  varying float vBurst;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec3 a = uRotA * aFrom;
    vec3 b = uRotB * aTo;
    float d = aRand * 0.45;
    float m = smoothstep(d, d + 0.55, uMix);
    vec3 p = mix(a, b, m);
    float burst = sin(m * 3.14159);
    vec3 dir = normalize(vec3(hash(aRand * 13.1) - 0.5, hash(aRand * 7.7) - 0.5, hash(aRand * 3.3) - 0.5) + 1e-4);
    p += dir * burst * (0.6 + aRand * 1.8);
    // gentle drift; photo shapes (portrait) stay almost still so features don't shimmer
    float drift = mix(aLumA, aLumB, m) > 0.999 ? 0.025 : 0.006;
    p += vec3(sin(uTime * 0.7 + aRand * 61.0), cos(uTime * 0.6 + aRand * 47.0), sin(uTime * 0.5 + aRand * 29.0)) * drift;
    // Anti-magnetic pointer field: particles scatter away and flow back when it lifts
    vec3 dp = p - uPointer;
    float pf = uForce * (1.0 - smoothstep(0.0, uRadius, length(dp.xy)));
    p += normalize(vec3(dp.xy, dp.z * 0.5) + 1e-4) * pf * (0.7 + aRand * 0.9);
    burst = max(burst, pf * 0.8);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // photo shapes (per-particle brightness) use even, fine grain; others keep a few big sparkles
    float lumMark = mix(aLumA, aLumB, m);
    float spread = lumMark > 0.999 ? 0.35 + pow(hash(aRand * 91.7), 3.0) * 2.2 : 0.75 + hash(aRand * 91.7) * 0.5;
    float size = uSize * mix(uSizeA, uSizeB, m) * spread;
    gl_PointSize = size * uPR / -mv.z;
    float tw = 0.6 + 0.4 * sin(uTime * (0.8 + aRand * 2.0) + aRand * 80.0);
    // shapes like the portrait carry per-particle brightness; twinkle is calmer for them
    float lumP = mix(aLumA, aLumB, m);
    vA = mix(1.0, tw, lumP > 0.999 ? 1.0 : 0.35) * (0.4 + 0.6 * hash(aRand * 17.3)) * lumP;
    vBurst = burst;
  }
`;

const morphFrag = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform float uOpacity;
  varying float vA;
  varying float vBurst;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    vec3 col = mix(uColA, uColB, clamp(a * 1.2 + vBurst * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(col, a * vA * uOpacity);
  }
`;

function Morph({ count, family, mobile, logos, face }: { count: number; family?: string; mobile: boolean; logos: LogoMask[]; face?: PortraitMask }) {
  const group = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const points = useRef<THREE.Points>(null!);
  const { gl } = useThree();
  const shapes = useMemo(() => buildShapes(count, family, logos, face), [count, family, logos, face]);
  const pair = useRef<[number, number]>([-1, -1]);
  const { camera } = useThree();
  const field = useMemo<PointerField>(() => ({ local: new THREE.Vector3(99, 99, 0), force: 0 }), []);
  const scratch = useMemo(() => ({ ray: new THREE.Vector3(), gp: new THREE.Vector3(), c: new THREE.Vector3() }), []);
  const fade = useRef(0);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
    g.setAttribute('aFrom', new THREE.BufferAttribute(shapes[0].slice(), 3));
    g.setAttribute('aTo', new THREE.BufferAttribute(shapes[0].slice(), 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    g.setAttribute('aLumA', new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
    g.setAttribute('aLumB', new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
    return g;
  }, [count, shapes]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: morphVert,
        fragmentShader: morphFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMix: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: mobile ? 26 : 38 },
          uPR: { value: Math.min(gl.getPixelRatio(), 1.75) },
          uRotA: { value: new THREE.Matrix3() },
          uRotB: { value: new THREE.Matrix3() },
          uSizeA: { value: 1 },
          uSizeB: { value: 1 },
          uColA: { value: new THREE.Color('#2F7BFF') },
          uColB: { value: new THREE.Color('#E4F4FF') },
          uOpacity: { value: 0 },
          uPointer: { value: new THREE.Vector3(99, 99, 0) },
          uForce: { value: 0 },
          uRadius: { value: 1.3 },
        },
      }),
    [gl, mobile],
  );

  const haloTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(225,242,255,0.95)');
    g.addColorStop(0.18, 'rgba(140,200,255,0.45)');
    g.addColorStop(0.5, 'rgba(47,123,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { from, to, mix, px, py } = sceneState;
    const u = material.uniforms;

    if (pair.current[0] !== from || pair.current[1] !== to) {
      (geometry.attributes.aFrom as THREE.BufferAttribute).set(shapes[from]);
      (geometry.attributes.aTo as THREE.BufferAttribute).set(shapes[to]);
      const lumA = geometry.attributes.aLumA as THREE.BufferAttribute;
      const lumB = geometry.attributes.aLumB as THREE.BufferAttribute;
      const la = SHAPE_BRIGHTNESS.get(shapes[from]);
      const lb = SHAPE_BRIGHTNESS.get(shapes[to]);
      if (la) lumA.set(la);
      else (lumA.array as Float32Array).fill(1);
      if (lb) lumB.set(lb);
      else (lumB.array as Float32Array).fill(1);
      lumA.needsUpdate = true;
      lumB.needsUpdate = true;
      geometry.attributes.aFrom.needsUpdate = true;
      geometry.attributes.aTo.needsUpdate = true;
      pair.current = [from, to];
    }
    u.uMix.value = mix;
    u.uTime.value = t;
    u.uPR.value = state.viewport.dpr;
    // Layout follows the live window, not the size at load, so rotating a phone or resizing works.
    // (Particle count and mesh detail stay as chosen at load — those are about the device, not the layout.)
    const narrow = state.size.width < 768;
    u.uSize.value = narrow ? 26 : 38;
    // Fade in on load, then ease toward this chapter's brightness
    const target = narrow ? lerp(DIM_MOBILE[SHAPE_CHAPTER[from]], DIM_MOBILE[SHAPE_CHAPTER[to]], mix) : 1;
    fade.current += (target - fade.current) * Math.min(1, delta * 1.5);
    // In the intro the solid shard crystal takes over; particles appear as it shatters
    const heroW = (SHAPE_CHAPTER[from] === 0 ? 1 - mix : 0) + (SHAPE_CHAPTER[to] === 0 && from !== to ? mix : 0);
    u.uOpacity.value = fade.current * (1 - heroW);
    points.current.visible = u.uOpacity.value > 0.003;
    shapeRotation(from, t, u.uRotA.value);
    shapeRotation(to, t, u.uRotB.value);
    u.uSizeA.value = SHAPE_SIZE[from] ?? 1;
    u.uSizeB.value = SHAPE_SIZE[to] ?? 1;

    const stage = narrow ? STAGE_MOBILE : STAGE_DESKTOP;
    const cf = SHAPE_CHAPTER[from];
    const ct = SHAPE_CHAPTER[to];
    const fit = narrow ? 1 : state.size.width / state.size.height / 1.6;
    const A = fitStage(stage[cf], fit);
    const B = fitStage(stage[ct], fit);
    const g = group.current;
    // The copy needs a fixed number of pixels, so on short phones the shape shrinks and lifts to clear it
    const short = narrow ? Math.min(1, Math.max(0.62, state.size.height / 800)) : 1;
    g.position.set(lerp(A[0], B[0], mix), lerp(A[1], B[1], mix) + (1 - short) * 0.55, lerp(A[2], B[2], mix));
    g.scale.setScalar(lerp(A[3], B[3], mix) * short);
    // Phones: the portrait is the image at the top of the About section, so once that section
    // reaches the top of the screen the portrait scrolls up with the copy instead of covering it
    // Same for the Contact portal on every screen size: past the top of the page it scrolls away
    // with the section instead of sitting over the title and the form
    const about = narrow ? lerp(cf === 1 ? 1 : 0, ct === 1 ? 1 : 0, mix) : 0;
    const contact = lerp(cf === 6 ? 1 : 0, ct === 6 ? 1 : 0, mix);
    const lift = about * Math.max(0, -sceneState.aboutTop) + contact * Math.max(0, -sceneState.contactTop);
    if (lift > 0) {
      const unitsPerPx = state.viewport.getCurrentViewport(camera, g.position).height / state.size.height;
      g.position.y += lift * unitsPerPx;
    }
    // Lean toward the pointer
    g.rotation.y += (px * 0.25 - g.rotation.y) * Math.min(1, delta * 2);
    g.rotation.x += (py * 0.15 - g.rotation.x) * Math.min(1, delta * 2);
    g.updateMatrixWorld();

    // Where the portrait (shape 1) sits on screen, so the real photo can resolve exactly over it
    const P = sceneState.portrait;
    P.on = face ? (from === 1 ? 1 - mix : 0) + (to === 1 && from !== 1 ? mix : 0) : 0;
    if (P.on > 0 && face) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let c = 0; c < 4; c++) {
        scratch.c.set((c & 1 ? 2 : -2) * face.aspect, c & 2 ? 2 : -2, 0).applyMatrix4(g.matrixWorld).project(camera);
        const sx = (scratch.c.x + 1) * 0.5 * state.size.width;
        const sy = (1 - scratch.c.y) * 0.5 * state.size.height;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      P.x = x0; P.y = y0; P.w = x1 - x0; P.h = y1 - y0;
    }

    // Pointer → a point on the shape's plane, in the group's local space
    scratch.ray.set(px, -py, 0.5).unproject(camera).sub(camera.position).normalize();
    g.getWorldPosition(scratch.gp);
    const along = (scratch.gp.z - camera.position.z) / scratch.ray.z;
    field.local.copy(camera.position).addScaledVector(scratch.ray, along);
    g.worldToLocal(field.local);
    field.force += ((sceneState.pActive ? 1 : 0) - field.force) * Math.min(1, delta * 5);
    u.uPointer.value.copy(field.local);
    u.uForce.value = field.force;

    const h = lerp(HALO[cf], HALO[ct], mix) * (0.85 + Math.sin(t * 1.4) * 0.15);
    // Real bloom handles the crystal's glow, so the soft halo only backs the particle shapes
    (halo.current.material as THREE.SpriteMaterial).opacity = h * u.uOpacity.value * 0.6;
    halo.current.visible = h * u.uOpacity.value > 0.003;

    // The water reflects whatever glows here: the crystal, then the portal in Contact
    g.getWorldPosition(lightSource.pos);
    lightSource.strength = heroW * (1 + field.force * 0.8) + (1 - heroW) * 0.45;
  });

  return (
    <group ref={group}>
      <Crystal field={field} mobile={mobile} shape="boxCorner" />
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
      <sprite ref={halo} scale={[4.6, 4.6, 1]}>
        <spriteMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ─── Sea: water surface, faded in for the intro and contact chapters ─── */

function Sea() {
  const opacity = useRef(0);
  useFrame((_, delta) => {
    const { from, to, mix } = sceneState;
    const target = lerp(OCEAN[SHAPE_CHAPTER[from]], OCEAN[SHAPE_CHAPTER[to]], mix);
    opacity.current += (target - opacity.current) * Math.min(1, delta * 3);
  });
  return <Water opacity={opacity} />;
}

/* ─── Deep-space dust for parallax depth ───────────────────────────────── */

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 26;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      a[i * 3 + 2] = -Math.abs(r * Math.cos(ph));
    }
    return a;
  }, [count]);
  const mat = useRef<THREE.PointsMaterial>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.008;
    // no stars over the open sea: the dust only shows in the deep-space chapters
    mat.current.opacity = 0.45 * (1 - ocean.amount);
    ref.current.visible = ocean.amount < 0.99;
    // drift with page progress so the world moves past as you scroll
    ref.current.position.y = sceneState.page * 6;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={mat} color="#7FB6FF" size={0.05} sizeAttenuation transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function CameraRig() {
  useFrame(({ camera }, delta) => {
    const k = Math.min(1, delta * 1.6);
    camera.position.x += (sceneState.px * 0.35 - camera.position.x) * k;
    camera.position.y += (0.15 - sceneState.py * 0.22 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ─── Quality governor ────────────────────────────────────────────────────
   Watches the frame rate and steps quality down when the device can't keep up:
   1 → lower resolution, 2 → 1× resolution, 3 → no bloom / grain. It only ever steps
   down, so the picture never flickers between levels. */

const MAX_LEVEL = 3;

function Governor({ onDrop }: { onDrop: () => void }) {
  const s = useRef({ frames: 0, time: 0, grace: 2 });
  useFrame((_, delta) => {
    const r = s.current;
    if (delta > 0.25) return; // tab switch or a one-off hitch: ignore
    r.frames++;
    r.time += delta;
    if (r.time < 1.5) return;
    const fps = r.frames / r.time;
    r.frames = 0;
    r.time = 0;
    // let shaders compile and the shapes settle before judging
    if (r.grace > 0) return void r.grace--;
    if (fps < 50) {
      onDrop();
      r.grace = 1;
    }
  });
  return null;
}

export type Tier = 'high' | 'low';

export default function Scene({ family, mobile, tier, logos, face }: { family?: string; mobile: boolean; tier: Tier; logos: LogoMask[]; face?: PortraitMask }) {
  // Phones and weaker machines start one step down (lower render resolution); the governor can go further
  const [level, setLevel] = useState(tier === 'low' || mobile ? 1 : 0);
  const maxDpr = level === 0 ? 1.5 : level === 1 ? 1.25 : 1;
  const count = mobile ? (tier === 'low' ? 6000 : 9000) : tier === 'low' ? 18000 : 28000;
  return (
    <Canvas
      camera={{ position: [0, 0.15, 7], fov: 45, near: 0.1, far: 80 }}
      dpr={[1, maxDpr]}
      // Opaque canvas + no renderer tone mapping: the composer does bloom, then ACES at the end
      flat
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
    >
      {level < MAX_LEVEL && <Governor onDrop={() => setLevel((l) => Math.min(MAX_LEVEL, l + 1))} />}
      <Sky />
      <CameraRig />
      <Dust count={mobile || tier === 'low' ? 350 : 900} />
      <Sea />
      <Morph count={count} family={family} mobile={mobile} logos={logos} face={face} />
      {level < MAX_LEVEL ? (
        <EffectComposer key="full" multisampling={0}>
          <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.62} luminanceSmoothing={0.3} radius={0.78} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          {/* fine film grain, like the reference */}
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.2} />
        </EffectComposer>
      ) : (
        <EffectComposer key="lite" multisampling={0}>
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
