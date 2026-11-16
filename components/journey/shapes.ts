import * as THREE from 'three';

/** Every shape returns `count` xyz positions, roughly within a radius of ~2.6. */

// Deterministic PRNG so the scene is identical between reloads
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

const gauss = (r: () => number) => {
  const u = 1 - r();
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Faceted crystal: points on faces, dense along edges, glowing interior. */
export function crystal(count: number) {
  const r = rng(1);
  const geo = new THREE.IcosahedronGeometry(1.25, 1).toNonIndexed();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  // Jitter shared vertices consistently so facets stay closed
  const jitter = new Map<string, THREE.Vector3>();
  const key = (v: THREE.Vector3) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
  const tris: THREE.Vector3[][] = [];
  for (let i = 0; i < pos.count; i += 3) {
    const tri = [0, 1, 2].map((k) => {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i + k);
      const kk = key(v);
      if (!jitter.has(kk)) {
        const s = 0.82 + r() * 0.36;
        jitter.set(kk, v.clone().multiplyScalar(s).multiply(new THREE.Vector3(0.95, 1.55, 0.95)));
      }
      return jitter.get(kk)!.clone();
    });
    tris.push(tri);
  }
  const out = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const [a, b, c] = tris[Math.floor(r() * tris.length)];
    const kind = r();
    if (kind < 0.38) {
      // edge
      const [u, v] = r() < 0.33 ? [a, b] : r() < 0.5 ? [b, c] : [c, a];
      p.lerpVectors(u, v, r());
    } else if (kind < 0.86) {
      // face
      let s = r();
      let t = r();
      if (s + t > 1) { s = 1 - s; t = 1 - t; }
      p.copy(a).addScaledVector(new THREE.Vector3().subVectors(b, a), s).addScaledVector(new THREE.Vector3().subVectors(c, a), t);
    } else {
      // core
      p.set(gauss(r), gauss(r) * 1.4, gauss(r)).multiplyScalar(0.28);
    }
    p.toArray(out, i * 3);
  }
  geo.dispose();
  return out;
}

/** Text sampled from a 2D canvas, e.g. initials. */
export function text(count: number, label: string, family = 'Arial Black, Arial, sans-serif', scale = 1) {
  const r = rng(2);
  const W = 640;
  const H = 320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 280px ${family}`;
  ctx.fillText(label, W / 2, H / 2 + 10);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    }
  }
  const out = new Float32Array(count * 3);
  const n = pts.length / 2;
  for (let i = 0; i < count; i++) {
    if (n === 0) break;
    const j = Math.floor(r() * n);
    const x = ((pts[j * 2] + r() * 2) / W - 0.5) * 5.6 * scale;
    const y = -((pts[j * 2 + 1] + r() * 2) / H - 0.5) * 2.8 * scale;
    const depth = r() < 0.9 ? gauss(r) * 0.12 : gauss(r) * 0.9;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = depth;
  }
  return out;
}

/** Spiral galaxy in the XZ plane (tilt is applied at render time). */
export function galaxy(count: number) {
  const r = rng(3);
  const out = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const rad = Math.pow(r(), 0.7) * 3.6;
    const arm = (i % 3) * ((Math.PI * 2) / 3);
    const spin = rad * 1.35;
    const scatter = (1 - rad / 3.6) * 0.35 + 0.08;
    const a = arm + spin + gauss(r) * 0.22;
    v.set(Math.cos(a) * rad + gauss(r) * scatter, gauss(r) * scatter * 0.6, Math.sin(a) * rad + gauss(r) * scatter);
    v.toArray(out, i * 3);
  }
  return out;
}

/* ─── Line-drawing helpers for the tool icons ─────────────────────────── */

type Seg = [number, number, number, number]; // x1, y1, x2, y2

const rectSegs = (x: number, y: number, w: number, h: number): Seg[] => [
  [x, y, x + w, y],
  [x + w, y, x + w, y + h],
  [x + w, y + h, x, y + h],
  [x, y + h, x, y],
];

const circleSegs = (cx: number, cy: number, r: number, n = 40): Seg[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const b = ((i + 1) / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r] as Seg;
  });

const polySegs = (pts: [number, number][]): Seg[] =>
  pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return [p[0], p[1], q[0], q[1]] as Seg;
  });

/**
 * Builds an icon: `lineShare` of points traced along `segs` (front and back
 * faces, so it has thickness), the rest from `fill(r)` or a soft scatter.
 */
function icon(
  count: number,
  seed: number,
  segs: Seg[],
  opts: { depth?: number; lineShare?: number; scale?: number; fill?: (r: () => number) => [number, number] | null } = {},
) {
  const r = rng(seed);
  const depth = opts.depth ?? 0.16;
  const lineShare = opts.lineShare ?? 0.72;
  const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
  const total = lens.reduce((x, y) => x + y, 0);
  const cum: number[] = [];
  lens.reduce((acc, l, i) => (cum[i] = acc + l), 0);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const kind = r();
    let x = 0;
    let y = 0;
    let z = 0;
    if (kind < lineShare) {
      const t = r() * total;
      let j = 0;
      while (j < cum.length - 1 && cum[j] < t) j++;
      const [a, b, c, d] = segs[j];
      const u = r();
      x = a + (c - a) * u + gauss(r) * 0.012;
      y = b + (d - b) * u + gauss(r) * 0.012;
      z = r() < 0.85 ? (r() < 0.5 ? -depth : depth) : (r() * 2 - 1) * depth;
    } else {
      const f = opts.fill?.(r);
      if (f && kind < 0.94) {
        [x, y] = f;
        z = (r() * 2 - 1) * depth * 0.6;
      } else {
        // soft glow scatter around the icon
        x = gauss(r) * 1.1;
        y = gauss(r) * 1.1;
        z = gauss(r) * 0.6;
      }
    }
    const sc = opts.scale ?? 1;
    out[i * 3] = x * sc;
    out[i * 3 + 1] = y * sc;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Gear — teeth outline, hub, and spokes. */
export function gear(count: number) {
  const N = 10;
  const Rb = 1.45;
  const Rt = 1.9;
  const pts: [number, number][] = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const step = (Math.PI * 2) / N;
    for (const [f, rad] of [[0, Rb], [0.12, Rt], [0.42, Rt], [0.54, Rb]] as const) {
      const ang = a + f * step;
      pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
    }
  }
  const segs: Seg[] = [...polySegs(pts), ...circleSegs(0, 0, 0.5), ...circleSegs(0, 0, 0.95, 48)];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.26;
    segs.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5, Math.cos(a) * 0.95, Math.sin(a) * 0.95]);
  }
  return icon(count, 11, segs, {
    depth: 0.22,
    scale: 0.8,
    fill: (r) => {
      const a = r() * Math.PI * 2;
      const rad = 0.95 + r() * (Rb - 0.95);
      return [Math.cos(a) * rad, Math.sin(a) * rad];
    },
  });
}

/** Terminal window — title bar, prompt, and lines of code. */
export function terminal(count: number) {
  const W = 3.6;
  const H = 2.5;
  const x0 = -W / 2;
  const y0 = -H / 2;
  const segs: Seg[] = [...rectSegs(x0, y0, W, H), [x0, 0.78, x0 + W, 0.78]];
  for (const cx of [-1.52, -1.3, -1.08]) segs.push(...circleSegs(cx, 0.99, 0.07, 12));
  // prompt  >_
  segs.push([-1.5, 0.48, -1.32, 0.36], [-1.32, 0.36, -1.5, 0.24], [-1.22, 0.22, -0.98, 0.22]);
  // code lines (indented like real code)
  const lines: [number, number, number][] = [
    [-0.82, 0.36, 0.7],
    [-1.5, -0.02, 1.25],
    [-1.25, -0.32, 0.55],
    [-1.25, -0.62, 1.05],
    [-1.5, -0.92, 0.35],
  ];
  for (const [x, y, len] of lines) segs.push([x, y, x + len, y]);
  segs.push([0.15, -0.02, 0.6, -0.02], [-0.55, -0.32, -0.1, -0.32]); // second tokens on a line
  return icon(count, 12, segs, {
    depth: 0.12,
    scale: 0.82,
    lineShare: 0.8,
    fill: (r) => [x0 + r() * W, y0 + r() * (H - 0.5)],
  });
}

/** Microchip — package, glowing core, pins, and circuit traces running out to pads. */
export function chip(count: number) {
  const B = 0.82; // half body
  const D = 0.36; // half core
  const segs: Seg[] = [...rectSegs(-B, -B, B * 2, B * 2), ...rectSegs(-D, -D, D * 2, D * 2)];
  // notch marking pin 1
  segs.push(...circleSegs(-B + 0.16, B - 0.16, 0.05, 10));
  const pins = [-0.56, -0.28, 0, 0.28, 0.56];
  const lens = [0.55, 0.3, 0.7, 0.4, 0.6];
  const pin = 0.2;
  // rotate a trace drawn for the top side onto each of the four sides
  const sides: ((x: number, y: number) => [number, number])[] = [
    (x, y) => [x, y],
    (x, y) => [-x, -y],
    (x, y) => [y, -x],
    (x, y) => [-y, x],
  ];
  sides.forEach((rot, si) => {
    pins.forEach((p, k) => {
      const L = lens[(k + si) % lens.length];
      const y1 = B + pin;
      const jog = k === 2 ? 0 : p > 0 ? 0.18 : -0.18;
      const pts: [number, number][] = [
        [p, B],
        [p, y1],
        [p, y1 + L * 0.5],
        [p + jog, y1 + L * 0.5 + Math.abs(jog)],
        [p + jog, y1 + L],
      ];
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, b] = rot(pts[i][0], pts[i][1]);
        const [c, d] = rot(pts[i + 1][0], pts[i + 1][1]);
        segs.push([a, b, c, d]);
      }
      const [ex, ey] = rot(p + jog, y1 + L);
      segs.push(...circleSegs(ex, ey, 0.055, 10));
    });
  });
  return icon(count, 13, segs, {
    depth: 0.12,
    lineShare: 0.68,
    // the core glows: dense fill inside the die
    fill: (r) => [(r() * 2 - 1) * D * 0.92, (r() * 2 - 1) * D * 0.92],
  });
}

/* ─── Company logos as 3D particle shapes ───────────────────────────────── */

/** A logo sampled into fill and outline pixels, normalised to roughly -1…1. */
export type LogoMask = { fill: Float32Array; edge: Float32Array; aspect: number };

type PixelTest = (r: number, g: number, b: number, a: number) => boolean;

/** Official logos in /public/logos and how to pick out the mark from each image. */
const LOGOS: { src: string; test: PixelTest }[] = [
  // Levant IT Solution — the lime rounded square; the "liT" letters are cut out of it
  { src: '/logos/levant.png', test: (r, g, b, a) => a > 128 && r > 150 && g > 170 && b < 160 },
  // Autoworx — the interlaced AW mark and wordmark, on white
  { src: '/logos/autoworx.png', test: (r, g, b, a) => a > 128 && r + g + b < 600 },
  // Luminar Technology — the blue "L" and squares, on dark navy
  { src: '/logos/luminar.png', test: (r, g, b, a) => a > 128 && b > 140 && b - r > 60 },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function maskFrom(src: string, test: PixelTest): Promise<LogoMask> {
  const img = await loadImage(src);
  const S = 320;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data;
  const on = new Uint8Array(S * S);
  let minX = S, minY = S, maxX = 0, maxY = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      if (test(d[i], d[i + 1], d[i + 2], d[i + 3])) {
        on[y * S + x] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const half = Math.max(w, h) / 2;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const fill: number[] = [];
  const edge: number[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!on[y * S + x]) continue;
      const nx = (x - cx) / half;
      const ny = -(y - cy) / half;
      const border =
        !on[y * S + x - 1] || !on[y * S + x + 1] || !on[(y - 1) * S + x] || !on[(y + 1) * S + x];
      (border ? edge : fill).push(nx, ny);
    }
  }
  return { fill: new Float32Array(fill), edge: new Float32Array(edge), aspect: w / h };
}

/** Loads the three Journey logos (Levant, Autoworx, Luminar) as particle masks. */
export function loadLogoMasks() {
  return Promise.all(LOGOS.map((l) => maskFrom(l.src, l.test)));
}

/** An extruded logo: crisp bright outlines, a solid face front and back, sides in between. */
export function logo(count: number, mask: LogoMask | undefined, seed: number) {
  const r = rng(seed);
  const out = new Float32Array(count * 3);
  if (!mask || mask.fill.length + mask.edge.length === 0) return globe(count); // fallback if an image failed
  const size = 1.75; // half-extent of the longest side
  const depth = 0.16;
  const nf = mask.fill.length / 2;
  const ne = mask.edge.length / 2;
  for (let i = 0; i < count; i++) {
    const useEdge = ne > 0 && (r() < 0.45 || nf === 0);
    const src = useEdge ? mask.edge : mask.fill;
    const j = Math.floor(r() * (useEdge ? ne : nf));
    const jitter = 0.006;
    out[i * 3] = (src[j * 2] + gauss(r) * jitter) * size;
    out[i * 3 + 1] = (src[j * 2 + 1] + gauss(r) * jitter) * size;
    // outlines run through the thickness (side walls); fill sits on the two faces
    out[i * 3 + 2] = useEdge ? (r() * 2 - 1) * depth : (r() < 0.5 ? -depth : depth) + gauss(r) * 0.01;
  }
  return out;
}

/** Wireframe globe with a faint halo. */
export function globe(count: number) {
  const r = rng(6);
  const out = new Float32Array(count * 3);
  const R = 2.0;
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const kind = r();
    if (kind < 0.3) {
      // meridians
      const lon = (Math.floor(r() * 14) / 14) * Math.PI * 2;
      const lat = (r() - 0.5) * Math.PI;
      v.setFromSphericalCoords(R, lat + Math.PI / 2, lon);
    } else if (kind < 0.6) {
      // parallels
      const lat = ((Math.floor(r() * 9) + 0.5) / 9 - 0.5) * Math.PI;
      v.setFromSphericalCoords(R, lat + Math.PI / 2, r() * Math.PI * 2);
    } else if (kind < 0.93) {
      v.setFromSphericalCoords(R, Math.acos(2 * r() - 1), r() * Math.PI * 2);
    } else {
      v.setFromSphericalCoords(R * (1.15 + r() * 0.6), Math.acos(2 * r() - 1), r() * Math.PI * 2);
    }
    v.toArray(out, i * 3);
  }
  return out;
}

/* ─── Vision horizons: 3D line figures ─────────────────────────────────── */

type Seg3 = [number, number, number, number, number, number];

/** Points traced along 3D segments, plus optional node clusters and a fill sampler. */
function wire(
  count: number,
  seed: number,
  segs: Seg3[],
  opts: { nodes?: [number, number, number, number][]; nodeShare?: number; fill?: (r: () => number) => [number, number, number]; fillShare?: number; jitter?: number } = {},
) {
  const r = rng(seed);
  const lens = segs.map(([a, b, c, d, e, f]) => Math.hypot(d - a, e - b, f - c));
  const cum: number[] = [];
  lens.reduce((acc, l, i) => (cum[i] = acc + l), 0);
  const total = cum[cum.length - 1] ?? 1;
  const nodeShare = opts.nodes ? opts.nodeShare ?? 0.3 : 0;
  const fillShare = opts.fill ? opts.fillShare ?? 0.2 : 0;
  const j = opts.jitter ?? 0.014;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = r();
    let x: number, y: number, z: number;
    if (k < nodeShare) {
      const [nx, ny, nz, nr] = opts.nodes![Math.floor(r() * opts.nodes!.length)];
      x = nx + gauss(r) * nr;
      y = ny + gauss(r) * nr;
      z = nz + gauss(r) * nr;
    } else if (k < nodeShare + fillShare) {
      [x, y, z] = opts.fill!(r);
    } else if (k < 0.97) {
      const t = r() * total;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < t) lo = mid + 1;
        else hi = mid;
      }
      const [a, b, c, d, e, f] = segs[lo];
      const u = r();
      x = a + (d - a) * u + gauss(r) * j;
      y = b + (e - b) * u + gauss(r) * j;
      z = c + (f - c) * u + gauss(r) * j;
    } else {
      // faint dust around the figure
      x = gauss(r) * 1.4;
      y = gauss(r) * 1.4;
      z = gauss(r) * 1.0;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Rounded-square outline in the x–z plane at height y, centred on (cx, cz). */
function roundRect(y: number, s: number, rad: number, cx = 0, cz = 0, steps = 6): Seg3[] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [s - rad, s - rad, 0],
    [-(s - rad), s - rad, Math.PI / 2],
    [-(s - rad), -(s - rad), Math.PI],
    [s - rad, -(s - rad), Math.PI * 1.5],
  ];
  for (const [x, z, a0] of corners)
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (k / steps) * (Math.PI / 2);
      pts.push([cx + x + Math.cos(a) * rad, cz + z + Math.sin(a) * rad]);
    }
  return pts.map(([x, z], i) => {
    const [x2, z2] = pts[(i + 1) % pts.length];
    return [x, y, z, x2, y, z2] as Seg3;
  });
}

/**
 * H1 · The Operating Layer — the universal "layers" mark: three platform slabs stacked with air
 * between them, the top one carrying a grid of app tiles (the OS everything runs on).
 */
export function layers(count: number) {
  const S = 1.4;
  const R = 0.32;
  const T = 0.1; // slab thickness
  const levels = [-1.3, 0, 1.3];
  const segs: Seg3[] = [];
  levels.forEach((y) => {
    // each slab: top and bottom outline, joined at the rounded corners so it reads as a solid plate
    segs.push(...roundRect(y + T / 2, S, R), ...roundRect(y - T / 2, S, R));
    for (const [x, z] of [[S - R * 0.3, S - R * 0.3], [-(S - R * 0.3), S - R * 0.3], [-(S - R * 0.3), -(S - R * 0.3)], [S - R * 0.3, -(S - R * 0.3)]] as const)
      segs.push([x, y - T / 2, z, x, y + T / 2, z]);
  });
  // app tiles on the top layer
  const top = levels[2] + T / 2 + 0.02;
  const tile = 0.3;
  const gap = 0.82;
  for (const i of [-1, 0, 1]) for (const k of [-1, 0, 1]) segs.push(...roundRect(top, tile, 0.09, i * gap, k * gap, 3));
  return wire(count, 51, segs, {
    jitter: 0.012,
    // a faint glow across each slab's face so the layers read as surfaces, not just outlines
    fillShare: 0.09,
    fill: (r) => {
      const y = levels[Math.floor(r() * levels.length)] + T / 2;
      const u = (r() * 2 - 1) * (S - 0.05);
      const v = (r() * 2 - 1) * (S - 0.05);
      return [u, y + gauss(r) * 0.008, v];
    },
  });
}

/** The 12 edges of an axis-aligned box. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Seg3[] {
  const out: Seg3[] = [];
  for (const y of [y0, y1]) for (const z of [z0, z1]) out.push([x0, y, z, x1, y, z]);
  for (const x of [x0, x1]) for (const z of [z0, z1]) out.push([x, y0, z, x, y1, z]);
  for (const x of [x0, x1]) for (const y of [y0, y1]) out.push([x, y, z0, x, y, z1]);
  return out;
}

/** A closed 2D outline (x–y) extruded between z = -d and z = +d, with a few struts joining the faces. */
function extrude(pts: [number, number][], d: number, struts: number[] = []): Seg3[] {
  const out: Seg3[] = [];
  for (const z of [-d, d])
    pts.forEach(([x, y], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length];
      out.push([x, y, z, x2, y2, z]);
    });
  for (const i of struts) {
    const [x, y] = pts[i];
    out.push([x, y, -d, x, y, d]);
  }
  return out;
}

/** Four-point sparkle outline with concave sides, as points around (cx, cy). */
function sparkleOutline(cx: number, cy: number, R: number, n = 64): [number, number][] {
  const P = 3.4; // how deeply the sides curve in
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    return [cx + R * Math.sign(c) * Math.abs(c) ** P, cy + R * Math.sign(sn) * Math.abs(sn) ** P] as [number, number];
  });
}

/**
 * H2 · Ambient Intelligence — the AI sparkle: one large four-point star with two smaller ones,
 * extruded into glowing solids.
 */
export function aiSpark(count: number) {
  const stars: [number, number, number][] = [
    [-0.35, -0.3, 1.75],
    [1.25, 1.2, 0.62],
    [1.55, -0.05, 0.36],
  ];
  const d = 0.16;
  const segs: Seg3[] = [];
  for (const [cx, cy, R] of stars) segs.push(...extrude(sparkleOutline(cx, cy, R), d * Math.min(1, R), [0, 16, 32, 48]));
  // inside test for the fill: the sparkle is |x|^(2/P) + |y|^(2/P) <= 1 in its own units
  const inside = (x: number, y: number) => Math.abs(x) ** (2 / 3.4) + Math.abs(y) ** (2 / 3.4) <= 1;
  return wire(count, 52, segs, {
    jitter: 0.012,
    fillShare: 0.2,
    fill: (r) => {
      // pick a star by area, then a point on its front or back face
      const k = r();
      const [cx, cy, R] = stars[k < 0.8 ? 0 : k < 0.94 ? 1 : 2];
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 20; tries++) {
        x = r() * 2 - 1;
        y = r() * 2 - 1;
        if (inside(x, y)) break;
      }
      const z = (r() < 0.5 ? -1 : 1) * d * Math.min(1, R);
      return [cx + x * R, cy + y * R, z];
    },
  });
}

/**
 * H3 · New Civic Infrastructure — a classical civic building: pediment roof, a row of columns and
 * a flight of steps (the symbol for government, education and capital).
 */
export function civic(count: number) {
  const W = 2.0; // half width of the building
  const D = 0.55; // half depth
  const segs: Seg3[] = [];
  // pediment: a triangular roof, extruded
  const roofBase = 1.05;
  const apex = 1.85;
  segs.push(...extrude([[-W - 0.12, roofBase], [W + 0.12, roofBase], [0, apex]], D + 0.06, [0, 1, 2]));
  // entablature beneath the roof
  segs.push(...box(-W - 0.05, W + 0.05, 0.78, roofBase, -D - 0.03, D + 0.03));
  // columns: the front row, each with a capital and a base
  const colX = [-1.6, -0.8, 0, 0.8, 1.6];
  const cw = 0.15;
  const cz = D - 0.12;
  for (const x of colX) {
    segs.push([x - cw, -1.05, cz, x - cw, 0.66, cz], [x + cw, -1.05, cz, x + cw, 0.66, cz]);
    segs.push(...box(x - cw - 0.07, x + cw + 0.07, 0.66, 0.78, cz - 0.09, cz + 0.09));
    segs.push(...box(x - cw - 0.06, x + cw + 0.06, -1.15, -1.05, cz - 0.08, cz + 0.08));
  }
  // the back wall, faint, so the portico has depth
  segs.push([-W + 0.1, -1.15, -D + 0.1, -W + 0.1, 0.78, -D + 0.1], [W - 0.1, -1.15, -D + 0.1, W - 0.1, 0.78, -D + 0.1]);
  // three steps
  const steps: [number, number, number][] = [
    [-1.15, -1.32, W + 0.12],
    [-1.32, -1.49, W + 0.3],
    [-1.49, -1.66, W + 0.48],
  ];
  steps.forEach(([y1, y0, hw], i) => segs.push(...box(-hw, hw, y0, y1, -D - 0.1 - i * 0.12, D + 0.1 + i * 0.12)));
  const out = wire(count, 55, segs, {
    jitter: 0.01,
    fillShare: 0.14,
    fill: (r) => {
      const k = r();
      if (k < 0.45) {
        // the face of the pediment
        let u = r();
        let v = r();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        const x = (-W - 0.12) * (1 - u - v) + (W + 0.12) * u;
        const y = roofBase * (1 - u - v) + roofBase * u + apex * v;
        return [x, y, D + 0.06];
      }
      if (k < 0.75) {
        // the columns' shafts
        const x = colX[Math.floor(r() * colX.length)] + (r() * 2 - 1) * cw;
        return [x, -1.05 + r() * 1.71, cz];
      }
      // the step treads
      const [y1, , hw] = steps[Math.floor(r() * steps.length)];
      return [(r() * 2 - 1) * hw, y1, (r() * 2 - 1) * (D + 0.1)];
    },
  });
  // wider than the other figures, so bring it in to the same footprint
  for (let k = 0; k < out.length; k++) out[k] *= 0.84;
  return out;
}

/** Portal ring with an inward-spiralling disc. */
export function ring(count: number) {
  const r = rng(7);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    if (r() < 0.7) {
      const R = 2.0 + gauss(r) * 0.05;
      out[i * 3] = Math.cos(a) * R;
      out[i * 3 + 1] = Math.sin(a) * R;
      out[i * 3 + 2] = gauss(r) * 0.06;
    } else {
      const R = Math.pow(r(), 0.5) * 1.9;
      const s = a + R * 1.4;
      out[i * 3] = Math.cos(s) * R;
      out[i * 3 + 1] = Math.sin(s) * R;
      out[i * 3 + 2] = -gauss(r) * 0.25 - (1.9 - R) * 0.4;
    }
  }
  return out;
}

/* ─── Portrait: a photo of Samir as a 3D particle figure ─────────────────── */

/** Pixels of the cut-out portrait with sampling weights and relief depth. */
export type PortraitMask = { x: Float32Array; y: Float32Array; z: Float32Array; lum: Float32Array; cum: Float32Array; step: number; aspect: number };

/** Optional per-particle brightness for a shape (shapes without an entry are full brightness). */
export const SHAPE_BRIGHTNESS = new WeakMap<Float32Array, Float32Array>();

/** Background-free portrait (cut out on-device with Apple Vision person segmentation).
 *  Same crop as /portrait/samir.webp, the real photo the particles resolve into. */
const PORTRAIT_SRC = '/portrait/samir-particles.png';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export async function loadPortraitMask(): Promise<PortraitMask> {
  const img = await loadImage(PORTRAIT_SRC);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H).data;
  const N = W * H;
  const inside = new Uint8Array(N);
  const lum = new Float32Array(N);
  const values: number[] = [];
  for (let i = 0; i < N; i++) {
    if (d[i * 4 + 3] < 128) continue;
    inside[i] = 1;
    lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    values.push(lum[i]);
  }
  // stretch contrast inside the figure (dark suit vs bright face/shirt)
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.04)] ?? 0;
  const hi = values[Math.floor(values.length * 0.97)] ?? 1;
  // distance from the silhouette edge (two-pass chamfer), used to round the body into 3D
  const dist = new Float32Array(N).fill(1e6);
  for (let i = 0; i < N; i++) if (!inside[i]) dist[i] = 0;
  for (let y = 1; y < H; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414, dist[i - W + 1] + 1.414);
    }
  for (let y = H - 2; y >= 0; y--)
    for (let x = W - 2; x > 0; x--) {
      const i = y * W + x;
      dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414, dist[i + W - 1] + 1.414);
    }
  // edge strength (Sobel on luminance, inside the figure only): traces glasses, eyes, mouth, lapels, tie
  const grad = new Float32Array(N);
  const Lat = (i: number) => (inside[i] ? lum[i] : lum[i] * 0); // outside counts as dark
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!inside[i]) continue;
      const gx = Lat(i - W + 1) + 2 * Lat(i + 1) + Lat(i + W + 1) - Lat(i - W - 1) - 2 * Lat(i - 1) - Lat(i + W - 1);
      const gy = Lat(i + W - 1) + 2 * Lat(i + W) + Lat(i + W + 1) - Lat(i - W - 1) - 2 * Lat(i - W) - Lat(i - W + 1);
      // ignore the silhouette itself (handled by the outline weight)
      const nearEdge = !inside[i - 1] || !inside[i + 1] || !inside[i - W] || !inside[i + W] || dist[i] < H * 0.006;
      grad[i] = nearEdge ? 0 : Math.min(1, Math.hypot(gx, gy) / Math.max(0.05, hi - lo) / 2.2);
    }
  // Locate the head from the silhouette itself: the widest extent of the figure in its top rows
  // (the hair), so the face/hair treatment is centred on the real head, not a guess.
  let topY = H, hx0 = W, hx1 = 0;
  for (let y = 0; y < H && topY === H; y++) for (let x = 0; x < W; x++) if (inside[y * W + x]) { topY = y; break; }
  const headBottom = topY + Math.round(H * 0.3); // roughly chin level
  // measure width over the hair only, above the shoulders
  for (let y = topY; y < topY + Math.round(H * 0.2); y++)
    for (let x = 0; x < W; x++)
      if (inside[y * W + x]) {
        if (x < hx0) hx0 = x;
        if (x > hx1) hx1 = x;
      }
  const headCx = (hx0 + hx1) / 2;
  const headHalf = (hx1 - hx0) / 2 + 2;
  const xs: number[] = [], ys: number[] = [], zs: number[] = [], ls: number[] = [], cum: number[] = [];
  let total = 0;
  const half = H / 2;
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!inside[i]) continue;
      const L = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.05, hi - lo)));
      const edge = !inside[i - 1] || !inside[i + 1] || !inside[i - W] || !inside[i + W];
      // How much of the "head treatment" applies here, 0→1, fading smoothly over the neck and
      // shoulders (and at the sides) so the head flows into the body with no visible seam.
      const fadeV = 1 - smoothstep(headBottom - H * 0.04, headBottom + H * 0.16, y);
      const fadeH = 1 - smoothstep(headHalf * 0.9, headHalf * 1.5, Math.abs(x - headCx));
      const head = fadeV * fadeH;
      // density follows the photo loosely; brightness carries the detail
      const base = 0.12 + Math.pow(L, 1.4) * 1.1 + (edge ? 0.25 : 0) + grad[i] * (0.3 + 0.3 * head);
      // extra particles toward the face; dark hair keeps a solid share there too
      const w = base + (Math.max(base, 0.55) * 2.8 - base) * head;
      // each particle glows like the photo; hair near the face keeps a soft glow, fading out with it
      const bright = 0.06 + 0.94 * Math.pow(L, 1.55);
      ls.push(bright + (Math.max(bright, 0.24) - bright) * head);
      total += w;
      cum.push(total);
      xs.push((x - W / 2) / half);
      ys.push(-(y - half) / half);
      const reliefPx = H * 0.055;
      const body = Math.sqrt(Math.min(dist[i], reliefPx) / reliefPx); // rounded relief, thickest at the centre
      // relief eases from the flatter head into the fuller body instead of stepping
      zs.push(body * (0.55 - 0.2 * fadeV) + (L - 0.5) * 0.08);
    }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), z: Float32Array.from(zs), lum: Float32Array.from(ls), cum: Float32Array.from(cum), step: 1 / half, aspect: W / H };
}

/** Samir's figure in particles. Falls back to the SH initials if the photo didn't load. */
export function portrait(count: number, mask: PortraitMask | undefined, family?: string) {
  if (!mask || mask.cum.length === 0) return text(count, 'SH', family);
  const r = rng(41);
  const out = new Float32Array(count * 3);
  const bright = new Float32Array(count);
  const size = 2.0; // half height in world units
  const total = mask.cum[mask.cum.length - 1];
  for (let i = 0; i < count; i++) {
    // weighted pick by binary search over the cumulative weights
    const target = r() * total;
    let lo = 0, hi = mask.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (mask.cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    out[i * 3] = (mask.x[lo] + (r() - 0.5) * mask.step) * size;
    out[i * 3 + 1] = (mask.y[lo] + (r() - 0.5) * mask.step) * size;
    out[i * 3 + 2] = mask.z[lo] + gauss(r) * 0.02;
    bright[i] = mask.lum[lo];
  }
  SHAPE_BRIGHTNESS.set(out, bright);
  return out;
}

/** Flat shape list — order must match SCENES[].shapes in store.ts. */
export function buildShapes(count: number, family?: string, logos: LogoMask[] = [], face?: PortraitMask) {
  return [
    crystal(count), // intro
    portrait(count, face, family), // manifesto — Samir in particles
    galaxy(count), // work
    text(count, '</>', family, 0.82), // principles
    logo(count, logos[0], 31), // journey · Levant IT Solution (2021)
    logo(count, logos[1], 32), // journey · Autoworx (2023)
    logo(count, logos[2], 33), // journey · Luminar Technology (2025)
    globe(count), // vision · founder letter
    ring(count), // contact
  ];
}
