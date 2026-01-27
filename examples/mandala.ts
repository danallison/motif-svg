/**
 * Ambitious Example: Generative Geometric Mandala
 *
 * Demonstrates the full power of declarative-svg:
 * - Deep nesting with $each
 * - Mathematical transformations
 * - Dynamic colors and gradients
 * - Composable layers
 * - Complex geometric patterns
 */

import { svg } from '../dist/index.js';

const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

// ============================================
// Utility functions
// ============================================

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const linspace = (start: number, end: number, n: number) =>
  range(n).map(i => start + (end - start) * i / (n - 1));

const polar = (r: number, theta: number) => ({
  x: r * Math.cos(theta),
  y: r * Math.sin(theta),
});

const hsl = (h: number, s: number, l: number, a = 1) =>
  a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;

// ============================================
// Layer generators
// ============================================

// Layer 1: Central flower of life pattern
const flowerOfLife = (cx: number, cy: number, r: number, depth: number) => {
  const circles: Array<{ x: number; y: number; r: number; depth: number }> = [];
  const visited = new Set<string>();

  const addCircle = (x: number, y: number, d: number) => {
    const key = `${Math.round(x * 100)},${Math.round(y * 100)}`;
    if (visited.has(key) || d > depth) return;
    visited.add(key);
    circles.push({ x, y, r, depth: d });

    // Add 6 surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6;
      addCircle(x + r * Math.cos(angle), y + r * Math.sin(angle), d + 1);
    }
  };

  addCircle(cx, cy, 0);
  return circles;
};

// Layer 2: Rotating petal rings
const petalRing = (n: number, innerR: number, outerR: number, rotation: number = 0) => {
  return range(n).map(i => {
    const angle = (i / n) * TAU + rotation;
    const nextAngle = ((i + 1) / n) * TAU + rotation;
    const midAngle = angle + TAU / n / 2;

    // Create petal shape using cubic bezier
    const p1 = polar(innerR, angle);
    const p2 = polar(outerR, midAngle);
    const p3 = polar(innerR, nextAngle);
    const cp1 = polar(innerR + (outerR - innerR) * 0.8, angle + TAU / n * 0.15);
    const cp2 = polar(innerR + (outerR - innerR) * 0.8, nextAngle - TAU / n * 0.15);

    return {
      path: `M ${p1.x} ${p1.y} Q ${cp1.x} ${cp1.y} ${p2.x} ${p2.y} Q ${cp2.x} ${cp2.y} ${p3.x} ${p3.y} Z`,
      angle: midAngle,
      index: i,
    };
  });
};

// Layer 3: Spirograph-like curves
const spirograph = (R: number, r: number, d: number, steps: number) => {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU * 10;
    const x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
    points.push({ x, y });
  }
  return points.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
};

// Layer 4: Interference rings
const interferenceRings = (n: number, maxR: number) => {
  return range(n).map(i => {
    const t = i / n;
    const r = maxR * Math.pow(t, 0.7);
    const thickness = 1 + Math.sin(i * 0.5) * 0.5;
    const opacity = 0.3 + Math.sin(i * 0.3) * 0.2;
    return { r, thickness, opacity, index: i };
  });
};

// Layer 5: Geometric star polygons
const starPolygon = (n: number, r1: number, r2: number, rotation: number = 0) => {
  const points: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const angle = (i / (n * 2)) * TAU + rotation;
    const p = polar(r, angle);
    points.push(`${p.x},${p.y}`);
  }
  return points.join(' ');
};

// Layer 6: Lissajous curves
const lissajous = (a: number, b: number, delta: number, scale: number, steps: number) => {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU;
    points.push({
      x: scale * Math.sin(a * t + delta),
      y: scale * Math.sin(b * t),
    });
  }
  return points.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ') + ' Z';
};

// ============================================
// Generate the mandala
// ============================================

const size = 800;
const cx = size / 2;
const cy = size / 2;

// Pre-compute all layers
const flowerCircles = flowerOfLife(0, 0, 30, 3);
const petalLayers = [
  { petals: petalRing(12, 60, 110, 0), hueBase: 200 },
  { petals: petalRing(8, 100, 160, TAU / 16), hueBase: 280 },
  { petals: petalRing(16, 150, 210, 0), hueBase: 320 },
  { petals: petalRing(6, 200, 280, TAU / 12), hueBase: 40 },
];
const interference = interferenceRings(60, 350);
const spiroPaths = [
  { path: spirograph(80, 30, 50, 500), color: hsl(180, 70, 50, 0.3), width: 1.5 },
  { path: spirograph(100, 23, 45, 500), color: hsl(220, 70, 50, 0.3), width: 1 },
  { path: spirograph(120, 37, 60, 500), color: hsl(260, 70, 50, 0.3), width: 1 },
];
const stars = [
  { n: 5, r1: 320, r2: 280, rotation: 0, hue: 50 },
  { n: 7, r1: 340, r2: 310, rotation: TAU / 14, hue: 30 },
  { n: 9, r1: 360, r2: 335, rotation: 0, hue: 10 },
];
const lissajousCurves = [
  { a: 3, b: 4, delta: TAU / 4, scale: 100, hue: 300 },
  { a: 5, b: 6, delta: TAU / 3, scale: 140, hue: 260 },
  { a: 7, b: 8, delta: TAU / 6, scale: 180, hue: 220 },
];

// Outer decorative dots
const outerDots = range(72).map(i => {
  const angle = (i / 72) * TAU;
  const r = 380 + Math.sin(i * 6) * 8;
  return { ...polar(r, angle), angle, index: i };
});

// Radiating lines
const radialLines = range(36).map(i => {
  const angle = (i / 36) * TAU;
  return { angle, index: i };
});

const mandala = svg({
  width: size,
  height: size,
  viewBox: `0 0 ${size} ${size}`,

  // Background with radial gradient effect
  defs: {
    radialGradient: [
      {
        id: 'bg-gradient',
        cx: '50%',
        cy: '50%',
        r: '50%',
        stop: [
          { offset: '0%', 'stop-color': '#1a1a2e' },
          { offset: '50%', 'stop-color': '#16213e' },
          { offset: '100%', 'stop-color': '#0f0f1a' },
        ],
      },
      {
        id: 'glow',
        cx: '50%',
        cy: '50%',
        r: '50%',
        stop: [
          { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.1 },
          { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 },
        ],
      },
    ],
    filter: {
      id: 'soft-glow',
      feGaussianBlur: { stdDeviation: 2, result: 'blur' },
      feMerge: {
        feMergeNode: [{ in: 'blur' }, { in: 'SourceGraphic' }],
      },
    },
  },

  // Background
  rect: { width: size, height: size, fill: 'url(#bg-gradient)' },

  // Main mandala group centered
  g: {
    transform: `translate(${cx}, ${cy})`,

    // Layer 0: Subtle radial lines
    line: {
      $each: radialLines,
      x1: ({ d }) => polar(50, d.angle).x,
      y1: ({ d }) => polar(50, d.angle).y,
      x2: ({ d }) => polar(390, d.angle).x,
      y2: ({ d }) => polar(390, d.angle).y,
      stroke: ({ d }) => hsl(d.index * 10, 50, 50, 0.1),
      'stroke-width': 0.5,
    },

    // Layer 1: Interference rings
    circle: [
      // Interference pattern
      {
        $each: interference,
        cx: 0,
        cy: 0,
        r: ({ d }) => d.r,
        fill: 'none',
        stroke: ({ d }) => hsl(200 + d.index * 2, 60, 60, d.opacity),
        'stroke-width': ({ d }) => d.thickness,
      },
      // Outer decorative dots
      {
        $each: outerDots,
        cx: ({ d }) => d.x,
        cy: ({ d }) => d.y,
        r: ({ d }) => 3 + Math.sin(d.index * 0.5) * 2,
        fill: ({ d }) => hsl(d.index * 5, 80, 60),
      },
      // Flower of life circles
      {
        $each: flowerCircles,
        cx: ({ d }) => d.x,
        cy: ({ d }) => d.y,
        r: ({ d }) => d.r,
        fill: 'none',
        stroke: ({ d }) => hsl(180 + d.depth * 30, 70, 70, 0.6 - d.depth * 0.1),
        'stroke-width': 1.5,
      },
    ],

    // Layer 2: Spirograph curves
    path: [
      // Spirographs
      ...spiroPaths.map(s => ({
        d: s.path,
        fill: 'none',
        stroke: s.color,
        'stroke-width': s.width,
      })),
      // Lissajous curves
      ...lissajousCurves.map(l => ({
        d: lissajous(l.a, l.b, l.delta, l.scale, 200),
        fill: hsl(l.hue, 60, 50, 0.1),
        stroke: hsl(l.hue, 70, 60, 0.5),
        'stroke-width': 1,
      })),
    ],

    // Layer 3: Petal rings (nested groups)
    g: [
      // Petal layers
      ...petalLayers.map((layer, layerIdx) => ({
        path: {
          $each: layer.petals,
          d: ({ d }) => d.path,
          fill: ({ d }) => hsl(layer.hueBase + d.index * (360 / layer.petals.length), 70, 50, 0.7),
          stroke: ({ d }) => hsl(layer.hueBase + d.index * (360 / layer.petals.length), 80, 70),
          'stroke-width': 1,
          filter: layerIdx === 1 ? 'url(#soft-glow)' : undefined,
        },
      })),
      // Star polygons
      ...stars.map(star => ({
        polygon: {
          points: starPolygon(star.n, star.r1, star.r2, star.rotation),
          fill: 'none',
          stroke: hsl(star.hue, 70, 60, 0.6),
          'stroke-width': 2,
          'stroke-linejoin': 'round',
        },
      })),
    ],

    // Layer 4: Central ornament
    g: {
      filter: 'url(#soft-glow)',
      circle: [
        { cx: 0, cy: 0, r: 25, fill: hsl(45, 80, 50), stroke: hsl(35, 90, 60), 'stroke-width': 3 },
        { cx: 0, cy: 0, r: 18, fill: 'none', stroke: hsl(45, 90, 70), 'stroke-width': 2 },
        { cx: 0, cy: 0, r: 10, fill: hsl(55, 90, 70) },
        { cx: 0, cy: 0, r: 5, fill: '#fff' },
      ],
      // Inner decorative ring
      circle: {
        $each: range(12),
        cx: ({ d }) => polar(20, d * TAU / 12).x,
        cy: ({ d }) => polar(20, d * TAU / 12).y,
        r: 3,
        fill: ({ d }) => hsl(45 + d * 30, 80, 60),
      },
    },
  },

  // Overlay glow
  circle: {
    cx,
    cy,
    r: 200,
    fill: 'url(#glow)',
  },
}, { pretty: true });

console.log(mandala);
