import { describe, it, expect } from 'vitest';
import { plot } from './plot.js';

const sampleData = [
  { x: 0, y: 10 },
  { x: 10, y: 20 },
  { x: 20, y: 15 },
  { x: 30, y: 25 },
];

describe('plot', () => {
  describe('basic rendering', () => {
    it('renders an SVG with correct dimensions', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
      });
      expect(result).toContain('width="400"');
      expect(result).toContain('height="300"');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });
  });

  describe('scatter plot', () => {
    it('renders circles for data points', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
      });
      const circleMatches = result.match(/<circle/g);
      expect(circleMatches).toHaveLength(sampleData.length);
    });

    it('uses default color steelblue', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
      });
      expect(result).toContain('fill="steelblue"');
    });
  });

  describe('line chart', () => {
    it('renders a path element', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'line',
      });
      expect(result).toContain('<path');
      expect(result).toContain('d="M');
    });

    it('renders dots at data points', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'line',
      });
      const circleMatches = result.match(/<circle/g);
      expect(circleMatches).toHaveLength(sampleData.length);
    });
  });

  describe('bar chart', () => {
    it('renders rectangles for data points', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'bar',
      });
      // Bars are rect elements (plus possible background rect)
      const rectMatches = result.match(/<rect/g);
      expect(rectMatches!.length).toBeGreaterThanOrEqual(sampleData.length);
    });
  });

  describe('area chart', () => {
    it('renders filled area path', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'area',
      });
      // Area chart has two paths: fill and stroke
      const pathMatches = result.match(/<path/g);
      expect(pathMatches!.length).toBeGreaterThanOrEqual(2);
      expect(result).toContain('opacity="0.3"');
    });
  });

  describe('axes', () => {
    it('renders x-axis', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
      });
      // X-axis has tick marks (lines) and labels (text)
      expect(result).toContain('<line');
      expect(result).toContain('<text');
    });

    it('renders y-axis', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
      });
      // Check for y-axis tick marks
      expect(result).toContain('x1="-5"');
    });

    it('renders grid lines by default for y-axis', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
      });
      expect(result).toContain('stroke="#e0e0e0"');
    });

    it('hides x-axis when xAxis is false', () => {
      const resultWithAxis = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        xAxis: {},
      });
      const resultWithoutAxis = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        xAxis: false,
      });
      // X-axis has horizontal line from x1="0" to x2=plotWidth with y1="0" y2="0"
      // Count the number of text-anchor="middle" (x-axis tick labels use middle, y-axis uses end)
      const withAxisMiddleAnchors = (resultWithAxis.match(/text-anchor="middle"/g) || []).length;
      const withoutAxisMiddleAnchors = (resultWithoutAxis.match(/text-anchor="middle"/g) || []).length;
      expect(withoutAxisMiddleAnchors).toBeLessThan(withAxisMiddleAnchors);
    });

    it('renders axis labels', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        xAxis: { label: 'X Label' },
        yAxis: { label: 'Y Label' },
      });
      expect(result).toContain('X Label');
      expect(result).toContain('Y Label');
    });
  });

  describe('custom colors', () => {
    it('uses static color', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
        color: 'red',
      });
      expect(result).toContain('fill="red"');
    });

    it('uses color function', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
        color: (d, i) => i % 2 === 0 ? 'red' : 'blue',
      });
      expect(result).toContain('fill="red"');
      expect(result).toContain('fill="blue"');
    });
  });

  describe('custom radius', () => {
    it('uses static radius', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
        radius: 10,
      });
      expect(result).toContain('r="10"');
    });

    it('uses radius function', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: [{ x: 0, y: 10, size: 5 }, { x: 10, y: 20, size: 15 }],
        x: d => d.x,
        y: d => d.y,
        type: 'scatter',
        radius: d => d.size,
      });
      expect(result).toContain('r="5"');
      expect(result).toContain('r="15"');
    });
  });

  describe('title', () => {
    it('renders chart title', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        title: 'My Chart',
      });
      expect(result).toContain('My Chart');
      expect(result).toContain('font-weight="bold"');
    });
  });

  describe('background', () => {
    it('renders background rectangle', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        background: '#f0f0f0',
      });
      expect(result).toContain('fill="#f0f0f0"');
    });
  });

  describe('margins', () => {
    it('applies custom margins', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
      });
      expect(result).toContain('translate(50, 50)');
    });
  });

  describe('tick formatting', () => {
    it('uses custom tick format', () => {
      const result = plot({
        width: 400,
        height: 300,
        data: sampleData,
        x: d => d.x,
        y: d => d.y,
        yAxis: { format: v => `$${v}` },
      });
      expect(result).toContain('$');
    });
  });
});
