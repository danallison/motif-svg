/**
 * Example: Perlin-like noise heatmap
 */

import { svg } from '../dist/index.js';

const cols = 20;
const rows = 20;
const cellSize = 20;

// Simple pseudo-random noise function
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth noise with interpolation
function smoothNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  const n00 = noise(x0, y0);
  const n10 = noise(x0 + 1, y0);
  const n01 = noise(x0, y0 + 1);
  const n11 = noise(x0 + 1, y0 + 1);

  const nx0 = n00 * (1 - fx) + n10 * fx;
  const nx1 = n01 * (1 - fx) + n11 * fx;

  return nx0 * (1 - fy) + nx1 * fy;
}

// Generate grid data
const cells = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: cols }, (_, col) => {
    const value = smoothNoise(col * 0.3, row * 0.3);
    return { row, col, value };
  })
).flat();

// Color interpolation from blue to red
function heatColor(t: number): string {
  const hue = (1 - t) * 240; // 240 (blue) to 0 (red)
  return `hsl(${hue}, 80%, 50%)`;
}

const heatmap = svg({
  width: cols * cellSize + 40,
  height: rows * cellSize + 40,
  style: 'background: #1a1a2e;',

  g: {
    transform: 'translate(20, 20)',

    // Grid cells
    rect: {
      $each: cells,
      x: ({ d }) => d.col * cellSize,
      y: ({ d }) => d.row * cellSize,
      width: cellSize - 1,
      height: cellSize - 1,
      fill: ({ d }) => heatColor(d.value),
      rx: 2,
    },
  },

  // Legend
  defs: {
    linearGradient: {
      id: 'legend-gradient',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '0%',
      stop: [
        { offset: '0%', 'stop-color': heatColor(0) },
        { offset: '50%', 'stop-color': heatColor(0.5) },
        { offset: '100%', 'stop-color': heatColor(1) },
      ],
    },
  },
}, { pretty: true });

console.log(heatmap);
