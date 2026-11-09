import type { AvatarShape } from '@shared/types';

/**
 * Original avatar character set, built from basic geometry at load time (circles, rounded polygons,
 * superellipses and a few parametric curves). Coordinates live in a 100×100 box centred on (50, 50);
 * bodies span roughly 10–90 so the picker ring has room.
 */
export interface ShapeDef {
  /** Body silhouette (also used for the selection ring). */
  d: string;
  /** Eye placement: centre line `y`, half-distance `dx` between the eyes, scale `s`. */
  eyes: { y: number; dx: number; s: number };
}

type Pt = [number, number];
const f = (n: number) => +n.toFixed(2);

/** Polygon with every corner softened by a quadratic curve of (at most) radius `r`. */
function roundPoly(pts: Pt[], r: number): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r, da / 2), rb = Math.min(r, db / 2);
    const p1: Pt = [p[0] + ((a[0] - p[0]) * ra) / da, p[1] + ((a[1] - p[1]) * ra) / da];
    const p2: Pt = [p[0] + ((b[0] - p[0]) * rb) / db, p[1] + ((b[1] - p[1]) * rb) / db];
    d += `${i === 0 ? 'M' : 'L'}${f(p1[0])} ${f(p1[1])}Q${f(p[0])} ${f(p[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** Closed Catmull-Rom spline through `pts`, emitted as cubic Béziers. */
function smooth(pts: Pt[]): string {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** Sample a closed parametric curve t ∈ [0, 2π) and smooth it. */
function curve(fn: (t: number) => Pt, steps = 48): string {
  return smooth(Array.from({ length: steps }, (_, i) => fn((i / steps) * Math.PI * 2)));
}

/** Circle subpath. Every circle winds the same way, so overlapping circles fill as one union. */
const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const rect = (x: number, y: number, w: number, h: number, r: number) => roundPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);

const ring = (n: number, radius: number, cx: number, cy: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  });

function starPts(points: number, outer: number, inner: number, cx: number, cy: number): Pt[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 ? inner : outer;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

const E = (y = 48, dx = 10, s = 1) => ({ y, dx, s });

const BASE: Record<string, ShapeDef> = {
  blob: { d: circle(50, 50, 40), eyes: E(46) },
  pebble: {
    d: curve((t) => {
      const r = 40 * (1 + 0.05 * Math.cos(2 * t) + 0.035 * Math.sin(3 * t));
      return [50 + 1.08 * r * Math.cos(t), 52 + 0.88 * r * Math.sin(t)];
    }),
    eyes: E(48),
  },
  egg: { d: curve((t) => [50 + 33 * Math.cos(t) * (1 + 0.12 * Math.sin(t)), 51 + 40 * Math.sin(t)]), eyes: E(52) },
  bean: {
    d: smooth([[14, 50], [20, 30], [36, 20], [50, 27], [64, 21], [80, 26], [89, 44], [84, 66], [64, 80], [40, 81], [22, 72]]),
    eyes: E(48),
  },
  squircle: {
    d: curve((t) => {
      const c = Math.cos(t), s = Math.sin(t);
      return [50 + 40 * Math.sign(c) * Math.abs(c) ** 0.5, 50 + 40 * Math.sign(s) * Math.abs(s) ** 0.5];
    }, 64),
    eyes: E(47),
  },
  square: { d: rect(12, 12, 76, 76, 20), eyes: E(47) },
  tablet: { d: rect(22, 11, 56, 78, 20), eyes: E(44, 8.5) },
  capsule: { d: rect(10, 26, 80, 48, 24), eyes: E(49) },
  cylinder: { d: rect(21, 10, 58, 80, 29), eyes: E(44, 8.5) },
  hex: { d: roundPoly(ring(6, 43, 50, 50), 11), eyes: E(48) },
  gem: { d: roundPoly([[29, 17], [71, 17], [91, 41], [50, 88], [9, 41]], 9), eyes: E(40, 9, 0.95) },
  crystal: { d: roundPoly([[50, 7], [85, 50], [50, 93], [15, 50]], 11), eyes: E(49, 7.5, 0.85) },
  wedge: { d: roundPoly([[50, 11], [91, 84], [9, 84]], 13), eyes: E(62, 8, 0.85) },
  shield: { d: roundPoly([[14, 13], [86, 13], [84, 58], [50, 91], [16, 58]], 16), eyes: E(44) },
  dome: { d: 'M10 56A40 40 0 0 1 90 56L90 78Q90 86 82 86L18 86Q10 86 10 78Z', eyes: E(58) },
  arch: { d: 'M21 46A29 29 0 0 1 79 46L79 82Q79 90 71 90L29 90Q21 90 21 82Z', eyes: E(54, 8.5) },
  cloud: { d: circle(29, 61, 19) + circle(52, 46, 26) + circle(73, 59, 19) + circle(50, 66, 20), eyes: E(56) },
  teardrop: {
    // Classic teardrop curve with its point turned upward.
    d: curve((t) => [50 + 37 * Math.sin(t) * Math.sin(t / 2), 50 - 40 * Math.cos(t)], 56),
    eyes: E(60),
  },
  leaf: { d: 'M20 80A54 54 0 0 1 80 20A54 54 0 0 1 20 80Z', eyes: E(50, 7.5, 0.85) },
  sparkle: { d: 'M50 6Q61 39 94 50Q61 61 50 94Q39 61 6 50Q39 39 50 6Z', eyes: E(49, 7, 0.8) },
  clover: {
    d: ring(3, 18, 50, 51).map(([x, y]) => circle(x, y, 21)).join('') + circle(50, 51, 18),
    eyes: E(52),
  },
  flower: {
    d: ring(6, 25, 50, 50, -Math.PI / 2 + Math.PI / 6).map(([x, y]) => circle(x, y, 15)).join('') + circle(50, 50, 25),
    eyes: E(48),
  },
  heart: {
    d: curve((t) => {
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [50 + 2.5 * x, 46 - 2.5 * y];
    }, 72),
    eyes: E(46),
  },
  house: { d: roundPoly([[50, 10], [90, 44], [90, 88], [10, 88], [10, 44]], 12), eyes: E(60) },
  star: { d: roundPoly(starPts(5, 45, 25, 50, 54), 7), eyes: E(55, 8, 0.85) },
};

export const SHAPES: Record<AvatarShape, ShapeDef> = BASE as Record<AvatarShape, ShapeDef>;
