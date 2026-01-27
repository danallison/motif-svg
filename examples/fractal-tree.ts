/**
 * Example: Recursive fractal tree
 */

import { svg } from '../dist/index.js';

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  angle: number;
}

// Generate all branches recursively
function generateTree(
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
  maxDepth: number,
  branches: Branch[] = []
): Branch[] {
  if (depth > maxDepth) return branches;

  const x2 = x + length * Math.sin(angle);
  const y2 = y - length * Math.cos(angle);

  branches.push({ x1: x, y1: y, x2, y2, depth, angle });

  const newLength = length * 0.72;
  const spread = Math.PI / 5; // 36 degrees

  // Left branch
  generateTree(x2, y2, newLength, angle - spread, depth + 1, maxDepth, branches);
  // Right branch
  generateTree(x2, y2, newLength, angle + spread, depth + 1, maxDepth, branches);

  return branches;
}

const maxDepth = 10;
const branches = generateTree(200, 380, 80, 0, 0, maxDepth);

const tree = svg({
  width: 400,
  height: 400,
  style: 'background: linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%);',

  // Gradient for branches
  defs: {
    linearGradient: {
      id: 'trunk-gradient',
      x1: '0%',
      y1: '100%',
      x2: '0%',
      y2: '0%',
      stop: [
        { offset: '0%', 'stop-color': '#8b4513' },
        { offset: '60%', 'stop-color': '#228b22' },
        { offset: '100%', 'stop-color': '#90ee90' },
      ],
    },
  },

  // Draw branches
  line: {
    $each: branches,
    x1: ({ d }) => d.x1,
    y1: ({ d }) => d.y1,
    x2: ({ d }) => d.x2,
    y2: ({ d }) => d.y2,
    stroke: ({ d }) => {
      const t = d.depth / maxDepth;
      if (t < 0.3) return '#8b4513';
      if (t < 0.6) return '#228b22';
      return `hsl(${100 + t * 40}, 70%, ${50 + t * 20}%)`;
    },
    'stroke-width': ({ d }) => Math.max(1, 8 - d.depth * 0.8),
    'stroke-linecap': 'round',
  },

  // Add some "leaves" at the tips
  circle: {
    $each: branches.filter(b => b.depth === maxDepth),
    cx: ({ d }) => d.x2,
    cy: ({ d }) => d.y2,
    r: ({ i }) => 2 + Math.random() * 2,
    fill: ({ i }) => `hsl(${80 + Math.random() * 60}, 70%, 60%)`,
    opacity: 0.8,
  },
}, { pretty: true });

console.log(tree);
