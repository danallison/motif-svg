/**
 * Example: Data-driven bar chart using plain functions
 */

import { svg } from '../dist/index.js';

const data = [
  { label: 'Jan', value: 30 },
  { label: 'Feb', value: 45 },
  { label: 'Mar', value: 28 },
  { label: 'Apr', value: 55 },
  { label: 'May', value: 42 },
];

const chart = svg({
  width: 400,
  height: 250,
  style: 'font-family: system-ui, sans-serif;',

  rect: {
    width: 400,
    height: 250,
    fill: '#f8f9fa',
  },

  g: [
    // Bars
    {
      transform: 'translate(50, 20)',
      rect: {
        $each: data,
        x: ({ i }) => i * 65,
        y: ({ d }) => 180 - d.value * 3,
        width: 50,
        height: ({ d }) => d.value * 3,
        fill: 'steelblue',
        rx: 4,
      },
    },
    // X-axis labels
    {
      transform: 'translate(50, 220)',
      text: {
        $each: data,
        x: ({ i }) => i * 65 + 25,
        y: 0,
        'text-anchor': 'middle',
        'font-size': 12,
        fill: '#666',
        $text: ({ d }) => d.label,
      },
    },
    // Y-axis labels
    {
      transform: 'translate(40, 20)',
      text: {
        $each: [0, 20, 40, 60],
        x: 0,
        y: ({ d }) => 180 - d * 3,
        'text-anchor': 'end',
        'font-size': 10,
        fill: '#999',
        $text: ({ d }) => d,
      },
    },
  ],
}, { pretty: true });

console.log(chart);
