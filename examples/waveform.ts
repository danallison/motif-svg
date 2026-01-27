/**
 * Example: Layered sine waves with gradients
 */

import { svg } from '../dist/index.js';

const width = 600;
const height = 300;
const resolution = 100;

// Generate wave configurations
const waves = [
  { amplitude: 40, frequency: 2, phase: 0, color: '#ff6b6b' },
  { amplitude: 30, frequency: 3, phase: Math.PI / 4, color: '#4ecdc4' },
  { amplitude: 25, frequency: 4, phase: Math.PI / 2, color: '#45b7d1' },
  { amplitude: 20, frequency: 5, phase: Math.PI, color: '#96ceb4' },
];

// Generate path data for a wave
function wavePath(wave: typeof waves[0]): string {
  const points: string[] = [];
  for (let i = 0; i <= resolution; i++) {
    const x = (i / resolution) * width;
    const y = height / 2 + wave.amplitude * Math.sin(
      (i / resolution) * Math.PI * 2 * wave.frequency + wave.phase
    );
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return points.join(' ');
}

const waveform = svg({
  width,
  height,
  viewBox: `0 0 ${width} ${height}`,
  style: 'background: linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%);',

  defs: {
    // Create gradient for each wave
    linearGradient: waves.map((wave, i) => ({
      id: `wave-gradient-${i}`,
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '0%',
      stop: [
        { offset: '0%', 'stop-color': wave.color, 'stop-opacity': 0.2 },
        { offset: '50%', 'stop-color': wave.color, 'stop-opacity': 0.8 },
        { offset: '100%', 'stop-color': wave.color, 'stop-opacity': 0.2 },
      ],
    })),
  },

  // Center line
  line: {
    x1: 0,
    y1: height / 2,
    x2: width,
    y2: height / 2,
    stroke: '#ffffff20',
    'stroke-width': 1,
    'stroke-dasharray': '5,5',
  },

  // Waves
  g: {
    $each: waves,
    path: {
      d: ({ d }) => wavePath(d),
      fill: 'none',
      stroke: ({ i }) => `url(#wave-gradient-${i})`,
      'stroke-width': 3,
      'stroke-linecap': 'round',
    },
  },
}, { pretty: true });

console.log(waveform);
