'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { SHAPE_CHAPTER, sceneState } from './store';

/** Pointer position in the parent group's local space, plus an eased 0→1 "pressing" amount. */
export type PointerField = { local: THREE.Vector3; force: number };

/*
 * A single cracked rock. The rock surface is split into Voronoi cells; each
 * cell becomes a solid piece (outer skin, inner skin, crack walls) so the
 * pieces fit together exactly. Light from a hot core leaks through the seams.
 * The pointer pushes pieces apart ("anti-magnetic"); springs pull them back.
 */

const CELLS = 26;
const VEINS = 34;
// Pieces are solid wedges reaching almost to the centre (no hollow inner shell)
const INNER = 0.1;
const SEAM = 0.988; // shrink each piece toward its centre → hairline seams at rest
const REPEL_RADIUS = 1.25;
const REPEL_PUSH = 0.85;

/* ─── Deterministic noise (CPU, for the rock shape) ─────────────────────── */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash3 = (x: number, y: number, z: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
};
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function fbm(x: number, y: number, z: number, oct = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) {
    s += a * (vnoise(x * f, y * f, z * f) * 2 - 1);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/* ─── Geometry ───────────────────────────────────────────────────────────── */

type Piece = {
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3; // rest centre (rock space)
  normal: THREE.Vector3; // outward direction
  axis: THREE.Vector3; // tumble axis
  off: THREE.Vector3;
  vel: THREE.Vector3;
};

/* ─── Shapes: each is a body size plus the flat planes that carve it ───── */

type Plane = { n: THREE.Vector3; d: number };
type RadialSpec = {
  kind?: 'radial';
  label: string;
  radii: THREE.Vector3;
  lean: number;
  planes: (r: () => number, support: (n: THREE.Vector3) => number) => Plane[];
};
/** A flat outline (2D signed distance) given thickness and a rough stone skin. */
type SdfSpec = {
  kind: 'sdf';
  label: string;
  depth: number; // half thickness
  extent: number; // half size of the sampling box
  outline: () => (x: number, y: number) => number;
};
type ShapeSpec = RadialSpec | SdfSpec;

const ring = (count: number, y: number, tilt: number, twist = 0) =>
  Array.from({ length: count }, (_, k) => {
    const a = twist + (k / count) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * tilt, y, Math.sin(a) * tilt).normalize();
  });

export const SHAPES = {
  gem: {
    label: 'Gem shard',
    radii: new THREE.Vector3(0.86, 1.85, 0.8),
    lean: 0.16,
    planes: (r, support) => {
      const out: Plane[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < 16; i++) {
        const y = (1 - (2 * (i + 0.5)) / 16) * 0.8;
        const rad = Math.sqrt(1 - y * y);
        const th = i * golden + (r() - 0.5) * 0.7;
        const n = new THREE.Vector3(Math.cos(th) * rad, y + (r() - 0.5) * 0.25, Math.sin(th) * rad).normalize();
        out.push({ n, d: support(n) * (0.8 + r() * 0.16) });
      }
      for (const end of [1, -1]) {
        const tilt = 1.15 + r() * 0.3;
        const twist = r() * Math.PI;
        for (let k = 0; k < 4; k++) {
          const a = twist + (k / 4) * Math.PI * 2 + (r() - 0.5) * 0.6;
          const n = new THREE.Vector3(Math.cos(a) * tilt, end, Math.sin(a) * tilt).normalize();
          out.push({ n, d: support(n) * (0.86 + r() * 0.08) });
        }
      }
      return out;
    },
  },
  diamond: {
    label: 'Diamond',
    radii: new THREE.Vector3(1.3, 1.75, 1.3),
    lean: 0,
    planes: (r, support) =>
      [...ring(8, 0.85, 1, 0.2), ...ring(8, -0.85, 1, 0.2 + Math.PI / 8)].map((n) => ({ n, d: support(n) * (0.9 + r() * 0.04) })),
  },
  monolith: {
    label: 'Monolith',
    radii: new THREE.Vector3(0.8, 2.0, 0.55),
    lean: 0.05,
    planes: (r, support) => {
      const ns = [
        new THREE.Vector3(1, 0.04, 0.05),
        new THREE.Vector3(-1, -0.03, 0.04),
        new THREE.Vector3(0.06, 0.02, 1),
        new THREE.Vector3(-0.05, 0.05, -1),
        new THREE.Vector3(0.55, 1, 0.25), // slanted, sliced-off top
        new THREE.Vector3(-0.1, -1, 0.08),
        new THREE.Vector3(0.7, 0.2, 0.7), // a few chamfered edges
        new THREE.Vector3(-0.7, -0.25, 0.7),
      ].map((n) => n.normalize());
      return ns.map((n, i) => ({ n, d: support(n) * (i < 4 ? 0.95 : i < 6 ? 0.9 : 0.97) + (r() - 0.5) * 0.01 }));
    },
  },
  boulder: {
    label: 'Boulder',
    radii: new THREE.Vector3(1.45, 1.35, 1.25),
    lean: 0.08,
    planes: (r, support) => {
      const out: Plane[] = [];
      for (let i = 0; i < 26; i++) {
        const n = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
        out.push({ n, d: support(n) * (0.8 + r() * 0.18) });
      }
      return out;
    },
  },
  quartz: {
    label: 'Quartz',
    radii: new THREE.Vector3(0.82, 2.1, 0.82),
    lean: 0.06,
    planes: (r, support) => [
      ...ring(6, 0, 1).map((n) => ({ n, d: support(n) * (0.88 + r() * 0.06) })),
      ...ring(6, 1, 1.25).map((n) => ({ n, d: support(n) * (0.86 + r() * 0.04) })),
      ...ring(6, -1, 1.25).map((n) => ({ n, d: support(n) * (0.86 + r() * 0.04) })),
    ],
  },
  blade: {
    label: 'Blade',
    radii: new THREE.Vector3(1.05, 2.0, 0.4),
    lean: 0.22,
    planes: (r, support) => {
      const out: Plane[] = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + (r() - 0.5) * 0.4;
        const n = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9, (r() - 0.5) * 0.6).normalize();
        out.push({ n, d: support(n) * (0.84 + r() * 0.12) });
      }
      out.push({ n: new THREE.Vector3(0.1, 0.05, 1).normalize(), d: 0.36 }, { n: new THREE.Vector3(-0.08, 0.1, -1).normalize(), d: 0.36 });
      for (const end of [1, -1]) {
        for (const n of ring(3, end, 1.7, r() * 3)) out.push({ n, d: support(n) * 0.82 });
      }
      return out;
    },
  },
  box: {
    label: 'Box',
    radii: new THREE.Vector3(1.65, 1.65, 1.65),
    lean: 0,
    planes: (r, support) => boxPlanes(r, support, new THREE.Quaternion()),
  },
  boxCorner: {
    label: 'Box on its corner',
    radii: new THREE.Vector3(1.5, 1.5, 1.5),
    lean: 0,
    // tip the cube so one corner points straight up
    planes: (r, support) =>
      boxPlanes(
        r,
        support,
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0)),
      ),
  },
  luminar: {
    kind: 'sdf',
    label: 'Luminar mark',
    depth: 0.42,
    extent: 2.3,
    outline: () => luminarOutline,
  },
  initials: {
    kind: 'sdf',
    label: 'SH initials',
    depth: 0.45,
    extent: 2.4,
    outline: () => textOutline('SH'),
  },
} satisfies Record<string, ShapeSpec>;

export type ShapeKey = keyof typeof SHAPES;

/** A stone cube: six faces, chipped corners and slightly bevelled edges, all a touch irregular. */
function boxPlanes(r: () => number, support: (n: THREE.Vector3) => number, turn: THREE.Quaternion): Plane[] {
  const out: Plane[] = [];
  const h = support(new THREE.Vector3(1, 0, 0)) * 0.72; // half the side of the cube
  const add = (x: number, y: number, z: number, d: number) => {
    const n = new THREE.Vector3(x + (r() - 0.5) * 0.06, y + (r() - 0.5) * 0.06, z + (r() - 0.5) * 0.06).normalize();
    out.push({ n: n.applyQuaternion(turn), d });
  };
  for (const [x, y, z] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) add(x, y, z, h * (0.98 + r() * 0.04));
  // chipped corners (a corner sits at h·√3 along its diagonal)
  for (const x of [1, -1]) for (const y of [1, -1]) for (const z of [1, -1]) add(x, y, z, h * Math.sqrt(3) * (0.86 + r() * 0.07));
  // bevelled edges (an edge sits at h·√2 along its diagonal)
  for (const [x, y, z] of [[1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0], [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1], [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]])
    add(x, y, z, h * Math.SQRT2 * (0.94 + r() * 0.03));
  return out;
}

/* ─── 2D outlines ──────────────────────────────────────────────────────── */

const sdRoundBox = (px: number, py: number, cx: number, cy: number, hx: number, hy: number, r: number) => {
  const qx = Math.abs(px - cx) - hx + r;
  const qy = Math.abs(py - cy) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
};

/** The Luminar "L" with its three squares, traced from the official logo's proportions. */
const LUMINAR_BOXES = (() => {
  const s = 1 / 44;
  const box = (x0: number, y0: number, x1: number, y1: number) => [
    ((x0 + x1) / 2 - 214) * s,
    -((y0 + y1) / 2 - 187) * s,
    ((x1 - x0) / 2) * s,
    ((y1 - y0) / 2) * s,
  ];
  return [
    box(135, 165, 183, 270), // L stem
    box(135, 222, 235, 270), // L foot
    box(135, 103, 183, 150), // top square
    box(196, 152, 243, 207), // middle square
    box(246, 226, 293, 271), // bottom-right square
  ];
})();
function luminarOutline(x: number, y: number) {
  let d = Infinity;
  for (const [cx, cy, hx, hy] of LUMINAR_BOXES) d = Math.min(d, sdRoundBox(x, y, cx, cy, hx, hy, 0.24));
  return d;
}

/** Signed distance to text drawn on a canvas (negative inside). */
function textOutline(label: string) {
  const W = 176, H = 96;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'Arial Black, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 92px ${family}`;
  ctx.fillText(label, W / 2, H / 2 + 4);
  const data = ctx.getImageData(0, 0, W, H).data;
  const inside = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) inside[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  const border: number[] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (inside[i] && (!inside[i - 1] || !inside[i + 1] || !inside[i - W] || !inside[i + W])) border.push(x, y);
    }
  const dist = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let best = Infinity;
      for (let k = 0; k < border.length; k += 2) {
        const dx = x - border[k], dy = y - border[k + 1];
        const d = dx * dx + dy * dy;
        if (d < best) best = d;
      }
      dist[y * W + x] = Math.sqrt(best) * (inside[y * W + x] ? -1 : 1);
    }
  const unit = 5.6 / W; // world units per pixel
  return (x: number, y: number) => {
    const px = x / unit + W / 2;
    const py = -y / unit + H / 2;
    const ix = Math.min(W - 2, Math.max(0, Math.floor(px)));
    const iy = Math.min(H - 2, Math.max(0, Math.floor(py)));
    const fx = Math.min(1, Math.max(0, px - ix)), fy = Math.min(1, Math.max(0, py - iy));
    const v00 = dist[iy * W + ix], v10 = dist[iy * W + ix + 1], v01 = dist[(iy + 1) * W + ix], v11 = dist[(iy + 1) * W + ix + 1];
    const v = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
    // outside the canvas just keep growing
    const ox = Math.max(0, Math.abs(px - W / 2) - W / 2), oy = Math.max(0, Math.abs(py - H / 2) - H / 2);
    return (v + Math.hypot(ox, oy)) * unit;
  };
}

/** Thick, rough stone from a 2D outline, meshed with marching cubes. */
function buildSdfRock(spec: SdfSpec, res: number) {
  const sd2 = spec.outline();
  const h = spec.depth;
  const round = 0.16;
  const sdf = (x: number, y: number, z: number) => {
    const wx = sd2(x, y) + round;
    const wy = Math.abs(z) - h + round;
    let d = Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0)) - round;
    // noise moves the surface by < 0.1, so points clearly inside/outside can skip it (much faster build)
    if (Math.abs(d) > 0.2) return d;
    // weathered stone: lumps, chipped edges, grit
    d += 0.05 * fbm(x * 1.7, y * 1.7, z * 1.7);
    d += 0.035 * Math.abs(fbm(x * 4.2 + 9, y * 4.2, z * 4.2));
    d += 0.008 * fbm(x * 12, y * 12, z * 12, 2);
    return d;
  };
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 160000);
  mc.isolation = 0;
  const half = res / 2;
  const E = spec.extent;
  for (let z = 0; z < res; z++)
    for (let y = 0; y < res; y++)
      for (let x = 0; x < res; x++) {
        mc.field[x + y * res + z * res * res] = -sdf(((x - half) / half) * E, ((y - half) / half) * E, ((z - half) / half) * E);
      }
  mc.update();
  const count = mc.count;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = mc.positionArray[i] * E;
  (mc.material as THREE.Material).dispose();
  mc.geometry.dispose();
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  // Make sure faces point outward (marching cubes winding depends on the field sign)
  const P = g.attributes.position as THREE.BufferAttribute;
  const N = g.attributes.normal as THREE.BufferAttribute;
  let out = 0;
  for (let i = 0; i < P.count; i += 7) out += P.getX(i) * N.getX(i) + P.getY(i) * N.getY(i) + P.getZ(i) * N.getZ(i);
  if (out < 0) {
    const idx = g.index!.array as Uint32Array | Uint16Array;
    for (let t = 0; t < idx.length; t += 3) {
      const tmp = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = tmp;
    }
    g.computeVertexNormals();
  }
  return g;
}

function buildRock(detail: number, spec: RadialSpec) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const R = spec.radii;
  const support = (n: THREE.Vector3) => Math.hypot(n.x * R.x, n.y * R.y, n.z * R.z);
  const planes = spec.planes(rng(19), support);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    // Distance to the nearest cutting plane along this direction → flat facets, sharp edges
    let r = Infinity;
    for (const { n, d } of planes) {
      const k = v.dot(n);
      if (k > 1e-4) r = Math.min(r, d / k);
    }
    if (!isFinite(r)) r = support(v);
    // a touch of grit so facets aren't machine-perfect
    r *= 1 + 0.012 * fbm(v.x * 7, v.y * 7, v.z * 7, 2);
    // lean so it isn't perfectly symmetric
    const lean = spec.lean * v.y * r;
    pos.setXYZ(i, v.x * r + lean * 0.35, v.y * r, v.z * r - lean * 0.15);
  }
  g.computeVertexNormals();
  return g;
}

function buildPieces(detail: number, spec: ShapeSpec) {
  const isSdf = spec.kind === 'sdf';
  const rock = isSdf ? buildSdfRock(spec, detail) : buildRock(detail, spec);
  const P = rock.attributes.position as THREE.BufferAttribute;
  const N = rock.attributes.normal as THREE.BufferAttribute;
  const idx = rock.index!.array;
  const triCount = idx.length / 3;
  const r = rng(7);

  const seeds: THREE.Vector3[] = [];
  const veins: THREE.Vector3[] = [];
  if (!isSdf) {
    const RADII = spec.radii;
    // Random (not evenly spaced) seeds so pieces vary in size like a real fracture
    for (let i = 0; i < CELLS; i++) {
      const u = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      if (u.lengthSq() > 1 || u.lengthSq() < 0.05) { i--; continue; }
      u.normalize();
      seeds.push(u.multiply(RADII).multiplyScalar(0.45 + r() * 0.4));
    }
    for (let i = 0; i < VEINS; i++) {
      const u = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
      veins.push(u.multiply(RADII).multiplyScalar(0.9 + r() * 0.3));
    }
  } else {
    // Seeds just under the surface, spread out so every part of the outline cracks
    const pick = (minGap: number, sink: number, list: THREE.Vector3[], n: number) => {
      let tries = 0;
      while (list.length < n && tries++ < 20000) {
        const i = Math.floor(r() * P.count);
        const p = new THREE.Vector3().fromBufferAttribute(P, i);
        const nn = new THREE.Vector3().fromBufferAttribute(N, i);
        p.addScaledVector(nn, -sink);
        if (list.every((q) => q.distanceTo(p) > minGap) || tries > 15000) list.push(p);
      }
    };
    pick(0.75, 0.3, seeds, CELLS);
    pick(0.35, -0.05, veins, VEINS);
  }

  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  // Separate parts of an outline (e.g. the Luminar squares) must never share a piece:
  // label connected surface components, and only let a triangle join a seed in its own part.
  const parent = new Int32Array(P.count).map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let t = 0; t < triCount; t++) {
    const ra = find(idx[t * 3]);
    parent[find(idx[t * 3 + 1])] = ra;
    parent[find(idx[t * 3 + 2])] = ra;
  }
  const compOf = (p: THREE.Vector3) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < P.count; i += 3) {
      const d = (P.getX(i) - p.x) ** 2 + (P.getY(i) - p.y) ** 2 + (P.getZ(i) - p.z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return find(best);
  };
  const cellSeeds = seeds.map((sd) => ({ p: sd, comp: isSdf ? compOf(sd) : 0 }));
  if (isSdf) {
    // any part left without a seed gets one of its own
    const covered = new Set(cellSeeds.map((c) => c.comp));
    for (let t = 0; t < triCount; t++) {
      const comp = find(idx[t * 3]);
      if (covered.has(comp)) continue;
      covered.add(comp);
      cellSeeds.push({ p: new THREE.Vector3().fromBufferAttribute(P, idx[t * 3]), comp });
    }
  }
  const triCell = new Int32Array(triCount);
  for (let t = 0; t < triCount; t++) {
    a.fromBufferAttribute(P, idx[t * 3]);
    b.fromBufferAttribute(P, idx[t * 3 + 1]);
    c.fromBufferAttribute(P, idx[t * 3 + 2]);
    m.copy(a).add(b).add(c).divideScalar(3);
    const comp = isSdf ? find(idx[t * 3]) : 0;
    let best = 0, bd = Infinity;
    cellSeeds.forEach((sd, k) => {
      if (sd.comp !== comp) return;
      const d = m.distanceToSquared(sd.p);
      if (d < bd) { bd = d; best = k; }
    });
    triCell[t] = best;
  }

  // Which triangle lies across each edge
  const edgeTris = new Map<string, number[]>();
  const ek = (i: number, j: number) => (i < j ? `${i}_${j}` : `${j}_${i}`);
  for (let t = 0; t < triCount; t++) {
    for (let e = 0; e < 3; e++) {
      const key = ek(idx[t * 3 + e], idx[t * 3 + ((e + 1) % 3)]);
      const list = edgeTris.get(key);
      if (list) list.push(t);
      else edgeTris.set(key, [t]);
    }
  }

  const pieces: Piece[] = [];
  for (let cell = 0; cell < cellSeeds.length; cell++) {
    const tris: number[] = [];
    for (let t = 0; t < triCount; t++) if (triCell[t] === cell) tris.push(t);
    if (!tris.length) continue;

    // mean outer point + mean outward normal of this piece
    const mean = new THREE.Vector3();
    const avgN = new THREE.Vector3();
    tris.forEach((t) => {
      for (let k = 0; k < 3; k++) {
        mean.add(a.fromBufferAttribute(P, idx[t * 3 + k]));
        avgN.add(b.fromBufferAttribute(N, idx[t * 3 + k]));
      }
    });
    mean.divideScalar(tris.length * 3);
    avgN.normalize();
    // the point each piece is carved toward: the rock's centre, or just inside a flat outline
    const core = isSdf ? mean.clone().addScaledVector(avgN, -(spec as SdfSpec).depth * 0.85) : new THREE.Vector3();
    const inward = (p: THREE.Vector3) => p.sub(core).multiplyScalar(INNER).add(core);
    const center = core.clone().lerp(mean, 0.55);

    const pos: number[] = [], nor: number[] = [], rest: number[] = [], glow: number[] = [];
    const vOut = (i: number) => a.fromBufferAttribute(P, i).clone();
    const shrink = (p: THREE.Vector3) => p.sub(center).multiplyScalar(SEAM).add(center);
    const push = (p: THREE.Vector3, n: THREE.Vector3, restP: THREE.Vector3, gl: number) => {
      const s = shrink(p.clone()).sub(center);
      pos.push(s.x, s.y, s.z);
      nor.push(n.x, n.y, n.z);
      rest.push(restP.x, restP.y, restP.z);
      glow.push(gl);
    };
    const nrm = (i: number) => new THREE.Vector3().fromBufferAttribute(N, i);

    for (const t of tris) {
      const ia = idx[t * 3], ib = idx[t * 3 + 1], ic = idx[t * 3 + 2];
      // outer skin: crisp facets for carved crystals, smooth weathered stone for outlines
      const fa = vOut(ia), fb = vOut(ib), fc = vOut(ic);
      const fn = new THREE.Vector3().subVectors(fb, fa).cross(new THREE.Vector3().subVectors(fc, fa)).normalize();
      push(fa, isSdf ? nrm(ia) : fn, fa.clone(), 0);
      push(fb, isSdf ? nrm(ib) : fn, fb.clone(), 0);
      push(fc, isSdf ? nrm(ic) : fn, fc.clone(), 0);
      // inner skin (reversed winding, faces the core)
      const ia2 = inward(vOut(ia)), ib2 = inward(vOut(ib)), ic2 = inward(vOut(ic));
      push(ia2, nrm(ia).negate(), ia2, 0.75);
      push(ic2, nrm(ic).negate(), ic2, 0.75);
      push(ib2, nrm(ib).negate(), ib2, 0.75);
      // crack walls along edges shared with another cell
      for (let e = 0; e < 3; e++) {
        const i = idx[t * 3 + e], j = idx[t * 3 + ((e + 1) % 3)];
        const across = edgeTris.get(ek(i, j))!.find((o) => o !== t);
        if (across === undefined || triCell[across] === cell) continue;
        const o1 = vOut(i), o2 = vOut(j), i1 = inward(vOut(i)), i2 = inward(vOut(j));
        const wn = new THREE.Vector3().subVectors(o2, o1).cross(new THREE.Vector3().subVectors(i1, o1)).normalize();
        const mid = o1.clone().add(o2).multiplyScalar(0.5);
        const facesOut = wn.dot(mid.clone().sub(center)) > 0;
        const quad = facesOut ? [o1, o2, i1, i1, o2, i2] : [o1, i1, o2, i1, i2, o2];
        const n2 = facesOut ? wn : wn.clone().negate();
        // brightest deep inside, dimmer at the rock's surface
        quad.forEach((p) => push(p.clone(), n2, p, p === i1 || p === i2 ? 0.75 : 0.22));
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geometry.setAttribute('aRest', new THREE.Float32BufferAttribute(rest, 3));
    geometry.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));
    geometry.computeBoundingSphere();

    pieces.push({
      geometry,
      center,
      normal: avgN.clone(),
      axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      off: new THREE.Vector3(),
      vel: new THREE.Vector3(),
    });
  }
  rock.dispose();
  return { pieces, seeds, veins };
}

/* ─── Material: stone + glowing cracks (injected into MeshStandardMaterial) ─ */

function makeMaterial(seeds: THREE.Vector3[], veins: THREE.Vector3[]) {
  const uniforms = {
    uSeeds: { value: seeds },
    uVeins: { value: veins },
    uGlowColor: { value: new THREE.Color('#9fd6ff') },
    uGlow: { value: 1 },
  };
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4a5f80'),
    roughness: 0.78,
    metalness: 0.08,
    transparent: true,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute vec3 aRest;
         attribute float aGlow;
         varying vec3 vRest;
         varying float vGlowMask;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vRest = aRest;
         vGlowMask = aGlow;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uSeeds[${CELLS}];
         uniform vec3 uVeins[${VEINS}];
         uniform vec3 uGlowColor;
         uniform float uGlow;
         varying vec3 vRest;
         varying float vGlowMask;
         float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
         float vn(vec3 p) {
           vec3 i = floor(p), f = fract(p);
           f = f * f * (3.0 - 2.0 * f);
           return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
                      mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
         }
         float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }
         // stone height field used for bump + shading (pits, ridges, fine grain)
         float stoneH(vec3 p) { return fbm3(p * 4.0) * 0.6 + fbm3(p * 13.0) * 0.3 + vn(p * 42.0) * 0.1; }
         // bump without tangents (screen-space derivatives), as in three's bumpmap chunk
         vec3 perturbStone(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
           vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
           vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
           float det = dot(sx, r1) * faceDir;
           vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
           return normalize(abs(det) * surfNorm - grad);
         }
         // distance to the nearest Voronoi boundary (true bisector distance)
         float edgeTo(vec3 s1, vec3 s2) { return abs(dot(vRest - 0.5 * (s1 + s2), normalize(s2 - s1))); }
         float cellEdge() {
           float d1 = 1e9, d2 = 1e9; vec3 s1 = vec3(0.0), s2 = vec3(1.0);
           for (int k = 0; k < ${CELLS}; k++) { vec3 s = uSeeds[k]; float d = distance(vRest, s);
             if (d < d1) { d2 = d1; s2 = s1; d1 = d; s1 = s; } else if (d < d2) { d2 = d; s2 = s; } }
           return edgeTo(s1, s2);
         }
         float veinEdge() {
           float d1 = 1e9, d2 = 1e9; vec3 s1 = vec3(0.0), s2 = vec3(1.0);
           for (int k = 0; k < ${VEINS}; k++) { vec3 s = uVeins[k]; float d = distance(vRest, s);
             if (d < d1) { d2 = d1; s2 = s1; d1 = d; s1 = s; } else if (d < d2) { d2 = d; s2 = s; } }
           return edgeTo(s1, s2);
         }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float sh = stoneH(vRest);
         float mottle = fbm3(vRest * 1.6 + 4.0);
         // darker in pits and crevices, lighter on ridges, broad colour variation
         diffuseColor.rgb *= mix(0.42, 1.25, smoothstep(0.25, 0.75, sh)) * (0.8 + 0.4 * mottle);
         diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.85, 0.92, 1.12), mottle);
         // tiny mineral glints
         float glint = smoothstep(0.86, 0.94, vn(vRest * 70.0)) * (1.0 - vGlowMask);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(roughnessFactor * mix(1.15, 0.7, sh) - glint * 0.5, 0.15, 1.0);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         if (vGlowMask < 0.01) {
           vec2 dH = vec2(dFdx(sh), dFdy(sh)) * 1.4;
           normal = perturbStone(-vViewPosition, normal, dH, faceDirection);
         }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float edge = cellEdge();
         float crack = 1.0 - smoothstep(0.0, 0.03, edge);
         float halo = (1.0 - smoothstep(0.0, 0.16, edge)) * 0.18;
         edge = veinEdge();
         // thin veins flicker in and out along their length
         float vein = (1.0 - smoothstep(0.0, 0.012, edge)) * smoothstep(0.35, 0.75, fbm3(vRest * 3.0));
         float g = max(max(crack, vein * 0.7), halo) * (1.0 - vGlowMask) + vGlowMask;
         totalEmissiveRadiance += uGlowColor * g * uGlow + vec3(0.55, 0.75, 1.0) * glint * 0.25;`,
      );
  };
  return { mat, uniforms };
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Crystal({
  field,
  mobile,
  shape = 'gem',
  detail,
  lights: withLights = true,
}: {
  field: PointerField;
  mobile: boolean;
  shape?: ShapeKey;
  detail?: number;
  lights?: boolean;
}) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const coreLight = useRef<THREE.PointLight>(null!);
  const lights = useRef<THREE.Group>(null!);

  const { pieces, material, uniforms } = useMemo(() => {
    const spec = SHAPES[shape] as ShapeSpec;
    // outlines are sampled on a 3D grid, carved crystals subdivide an icosahedron
    const res = spec.kind === 'sdf' ? (mobile ? 64 : 84) : detail ?? (mobile ? 30 : 46);
    const built = buildPieces(res, spec);
    const { mat, uniforms: u } = makeMaterial(built.seeds, built.veins);
    return { pieces: built.pieces, material: mat, uniforms: u };
  }, [mobile, shape, detail]);
  const sway = (SHAPES[shape] as ShapeSpec).kind === 'sdf';



  const tmp = useMemo(
    () => ({
      spin: new THREE.Quaternion(),
      tumble: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      world: new THREE.Vector3(),
      nrm: new THREE.Vector3(),
      target: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      acc: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    const { from, to, mix } = sceneState;
    // 1 while the intro chapter is on screen, 0 once it has morphed away
    const w = (SHAPE_CHAPTER[from] === 0 ? 1 - mix : 0) + (SHAPE_CHAPTER[to] === 0 && from !== to ? mix : 0);
    const explode = 1 - w;
    const visible = w > 0.01;
    lights.current.visible = visible && withLights;

    // Light swells while the crystal is pushed open
    const open = field.force;
    const pulse = 0.92 + Math.sin(t * 1.3) * 0.08;
    uniforms.uGlow.value = (1.6 + open * 1.4) * pulse * (0.25 + 0.75 * w);
    material.opacity = Math.min(1, w * 1.6);
    coreLight.current.intensity = (14 + open * 22) * w * pulse;

    tmp.spin.setFromEuler(
      sway
        ? tmp.euler.set(Math.sin(t * 0.3) * 0.12, -0.25 + Math.sin(t * 0.22) * 0.45, Math.sin(t * 0.17) * 0.04) // logos stay readable
        : tmp.euler.set(Math.sin(t * 0.25) * 0.08, t * 0.12, Math.sin(t * 0.2) * 0.05),
    );

    const k = 110; // spring stiffness
    const c = 10; // damping — small bounce on reunion

    pieces.forEach((p, i) => {
      const m = meshes.current[i];
      if (!m) return;
      m.visible = visible;
      if (!visible) return;

      tmp.world.copy(p.center).applyQuaternion(tmp.spin);
      tmp.nrm.copy(p.normal).applyQuaternion(tmp.spin);

      // Anti-magnetic field from the pointer
      const dx = tmp.world.x - field.local.x;
      const dy = tmp.world.y - field.local.y;
      const dist = Math.hypot(dx, dy);
      const fall = Math.min(1, dist / REPEL_RADIUS);
      const f = open * (1 - fall * fall * (3 - 2 * fall));
      tmp.dir.copy(tmp.nrm).multiplyScalar(0.9);
      if (dist > 1e-4) {
        tmp.dir.x += (dx / dist) * 0.6;
        tmp.dir.y += (dy / dist) * 0.6;
      }
      tmp.dir.normalize();
      tmp.target.copy(tmp.dir).multiplyScalar(f * REPEL_PUSH);
      // a barely-there breathing so the rock feels alive
      tmp.target.addScaledVector(tmp.nrm, 0.012 * (1 + Math.sin(t * 0.9 + i * 1.7)));
      // scrolling away blows the rock apart
      tmp.target.addScaledVector(tmp.nrm, explode * 3.6);

      tmp.acc.copy(tmp.target).sub(p.off).multiplyScalar(k).addScaledVector(p.vel, -c);
      p.vel.addScaledVector(tmp.acc, dt);
      p.off.addScaledVector(p.vel, dt);

      m.position.copy(tmp.world).add(p.off);
      tmp.tumble.setFromAxisAngle(p.axis, p.off.length() * 0.55);
      m.quaternion.copy(tmp.tumble).multiply(tmp.spin);
      m.scale.setScalar(1 - explode * 0.5);
    });
  });

  return (
    <group>
      <group ref={lights} visible={withLights}>
        {/* cold moonlight from above-left, a rim from behind, and the hot core */}
        <directionalLight position={[-3, 5, 4]} color="#b9d4ff" intensity={1.1} />
        <directionalLight position={[2, 1, -5]} color="#5d9bff" intensity={2.4} />
        <hemisphereLight args={['#5f86c8', '#01040c', 0.35]} />
        <pointLight ref={coreLight} position={[0, 0, 0]} color="#a8dcff" intensity={14} distance={6} decay={1.5} />
      </group>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={p.geometry}
          material={material}
        />
      ))}
    </group>
  );
}
