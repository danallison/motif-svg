/**
 * Example: Radial sunburst / starburst pattern
 */

import { svg } from '../dist/index.js';

const cx = 200;
const cy = 200;
const rays = 36;
const rings = 8;

// Generate concentric ring data
const ringData = Array.from({ length: rings }, (_, ringIndex) => ({
  innerRadius: 20 + ringIndex * 22,
  outerRadius: 20 + (ringIndex + 1) * 22 - 2,
  ringIndex,
}));

// Generate rays
const rayAngles = Array.from({ length: rays }, (_, i) => ({
  angle: (i / rays) * Math.PI * 2,
  index: i,
}));

// Arc path generator
function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + innerR * Math.cos(startAngle);
  const y1 = cy + innerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(startAngle);
  const y2 = cy + outerR * Math.sin(startAngle);
  const x3 = cx + outerR * Math.cos(endAngle);
  const y3 = cy + outerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(endAngle);
  const y4 = cy + innerR * Math.sin(endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}`,
    'Z',
  ].join(' ');
}

// Generate all segments
const segments = ringData.flatMap(ring =>
  rayAngles.map(ray => ({
    ...ring,
    ...ray,
    startAngle: ray.angle - Math.PI / rays + 0.02,
    endAngle: ray.angle + Math.PI / rays - 0.02,
  }))
);

const sunburst = svg({
  width: 400,
  height: 400,
  style: 'background: radial-gradient(circle, #1a1a3e 0%, #0a0a1e 100%);',

  // Segments
  path: {
    $each: segments,
    d: ({ d }) => arcPath(cx, cy, d.innerRadius, d.outerRadius, d.startAngle, d.endAngle),
    fill: ({ d }) => {
      const hue = (d.index / rays) * 360;
      const lightness = 40 + (d.ringIndex / rings) * 30;
      return `hsl(${hue}, 75%, ${lightness}%)`;
    },
    stroke: '#0a0a1e',
    'stroke-width': 0.5,
  },

  // Center circle
  circle: {
    cx,
    cy,
    r: 18,
    fill: '#fff',
    opacity: 0.9,
  },
}, { pretty: true });

console.log(sunburst);
