/**
 * Example: Fibonacci spiral with dots
 */

import { svg } from '../dist/index.js';

// Generate spiral points using golden angle
const count = 200;
const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

const points = Array.from({ length: count }, (_, i) => {
  const angle = i * goldenAngle;
  const radius = Math.sqrt(i) * 8;
  return {
    x: 200 + radius * Math.cos(angle),
    y: 200 + radius * Math.sin(angle),
    size: 2 + (i / count) * 4,
    hue: (i / count) * 360,
  };
});

const spiral = svg({
  width: 400,
  height: 400,
  style: 'background: #1a1a2e;',

  circle: {
    $each: points,
    cx: ({ d }) => d.x,
    cy: ({ d }) => d.y,
    r: ({ d }) => d.size,
    fill: ({ d }) => `hsl(${d.hue}, 80%, 60%)`,
    opacity: ({ i }) => 0.5 + (i / count) * 0.5,
  },
}, { pretty: true });

console.log(spiral);
