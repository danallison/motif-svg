/**
 * Example: Flow field visualization
 */

import { svg } from '../dist/index.js';

const width = 500;
const height = 400;
const gridSize = 20;
const lineLength = 15;

// Flow field function - returns angle at position
function flowAngle(x: number, y: number): number {
  // Create interesting patterns using trigonometry
  const scale = 0.02;
  return (
    Math.sin(x * scale) * Math.cos(y * scale * 0.5) * Math.PI +
    Math.cos((x + y) * scale * 0.3) * Math.PI * 0.5
  );
}

// Generate grid points
const points: Array<{ x: number; y: number; angle: number }> = [];
for (let y = gridSize; y < height - gridSize; y += gridSize) {
  for (let x = gridSize; x < width - gridSize; x += gridSize) {
    points.push({
      x,
      y,
      angle: flowAngle(x, y),
    });
  }
}

const flowField = svg({
  width,
  height,
  style: 'background: #0d1117;',

  // Flow lines
  line: {
    $each: points,
    x1: ({ d }) => d.x,
    y1: ({ d }) => d.y,
    x2: ({ d }) => d.x + Math.cos(d.angle) * lineLength,
    y2: ({ d }) => d.y + Math.sin(d.angle) * lineLength,
    stroke: ({ d }) => {
      // Color based on angle
      const hue = ((d.angle + Math.PI) / (Math.PI * 2)) * 360;
      return `hsl(${hue}, 70%, 60%)`;
    },
    'stroke-width': 2,
    'stroke-linecap': 'round',
    opacity: 0.8,
  },

  // Arrow heads
  circle: {
    $each: points,
    cx: ({ d }) => d.x + Math.cos(d.angle) * lineLength,
    cy: ({ d }) => d.y + Math.sin(d.angle) * lineLength,
    r: 2,
    fill: ({ d }) => {
      const hue = ((d.angle + Math.PI) / (Math.PI * 2)) * 360;
      return `hsl(${hue}, 70%, 70%)`;
    },
  },
}, { pretty: true });

console.log(flowField);
