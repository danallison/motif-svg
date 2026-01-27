import { describe, it, expect } from 'vitest';
import { svg } from './svg.js';

describe('svg', () => {
  describe('basic rendering', () => {
    it('renders an empty SVG with namespace', () => {
      const result = svg({ width: 100, height: 100 });
      expect(result).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>');
    });

    it('renders a simple element with attributes', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: { x: 10, y: 20, width: 50, height: 30, fill: 'blue' },
      });
      expect(result).toContain('<rect x="10" y="20" width="50" height="30" fill="blue"/>');
    });

    it('renders multiple different elements', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: { x: 0, y: 0, width: 10, height: 10 },
        circle: { cx: 50, cy: 50, r: 25 },
      });
      expect(result).toContain('<rect');
      expect(result).toContain('<circle');
    });
  });

  describe('multiple elements of same type', () => {
    it('renders array of elements', () => {
      const result = svg({
        width: 100,
        height: 100,
        circle: [
          { cx: 25, cy: 50, r: 10 },
          { cx: 75, cy: 50, r: 10 },
        ],
      });
      const circleMatches = result.match(/<circle/g);
      expect(circleMatches).toHaveLength(2);
    });
  });

  describe('nested elements', () => {
    it('renders groups with children', () => {
      const result = svg({
        width: 100,
        height: 100,
        g: {
          transform: 'translate(10, 10)',
          rect: { width: 20, height: 20 },
        },
      });
      expect(result).toContain('<g transform="translate(10, 10)">');
      expect(result).toContain('<rect');
      expect(result).toContain('</g>');
    });
  });

  describe('$each iteration', () => {
    it('creates multiple elements from array', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: [1, 2, 3],
          x: ({ i }) => i * 30,
          width: 25,
          height: 25,
        },
      });
      const rectMatches = result.match(/<rect/g);
      expect(rectMatches).toHaveLength(3);
      expect(result).toContain('x="0"');
      expect(result).toContain('x="30"');
      expect(result).toContain('x="60"');
    });

    it('provides data item in context', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: [10, 20, 30],
          width: ({ d }) => d,
          height: 10,
        },
      });
      expect(result).toContain('width="10"');
      expect(result).toContain('width="20"');
      expect(result).toContain('width="30"');
    });

    it('provides full data array in context', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: [1, 2, 3],
          width: ({ data }) => data.length * 10,
          height: 10,
        },
      });
      expect(result).toContain('width="30"');
    });
  });

  describe('$if conditional', () => {
    it('renders element when condition is true', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $if: true,
          width: 50,
          height: 50,
        },
      });
      expect(result).toContain('<rect');
    });

    it('skips element when condition is false', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $if: false,
          width: 50,
          height: 50,
        },
      });
      expect(result).not.toContain('<rect');
    });

    it('evaluates dynamic condition', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: [1, 2, 3, 4],
          $if: ({ d }) => d % 2 === 0,
          width: ({ d }) => d * 10,
          height: 10,
        },
      });
      const rectMatches = result.match(/<rect/g);
      expect(rectMatches).toHaveLength(2);
      expect(result).toContain('width="20"');
      expect(result).toContain('width="40"');
    });
  });

  describe('$text content', () => {
    it('renders text content', () => {
      const result = svg({
        width: 100,
        height: 100,
        text: {
          x: 50,
          y: 50,
          $text: 'Hello',
        },
      });
      expect(result).toContain('<text x="50" y="50">Hello</text>');
    });

    it('renders dynamic text content', () => {
      const result = svg({
        width: 100,
        height: 100,
        text: {
          $each: ['A', 'B', 'C'],
          x: ({ i }) => i * 30,
          y: 50,
          $text: ({ d }) => d,
        },
      });
      expect(result).toContain('>A</text>');
      expect(result).toContain('>B</text>');
      expect(result).toContain('>C</text>');
    });
  });

  describe('$raw injection', () => {
    it('injects raw SVG string', () => {
      const icon = '<circle cx="10" cy="10" r="5"/>';
      const result = svg({
        width: 100,
        height: 100,
        g: {
          $raw: icon,
        },
      });
      expect(result).toContain(icon);
    });

    it('injects dynamic raw content', () => {
      const icons = ['<circle r="5"/>', '<rect width="10"/>'];
      const result = svg({
        width: 100,
        height: 100,
        g: {
          $each: icons,
          $raw: ({ d }) => d,
        },
      });
      expect(result).toContain('<circle r="5"/>');
      expect(result).toContain('<rect width="10"/>');
    });
  });

  describe('nested $each with parent context', () => {
    it('provides parent context in nested iteration', () => {
      const grid = [[1, 2], [3, 4]];
      const result = svg({
        width: 100,
        height: 100,
        g: {
          $each: grid,
          transform: ({ i }) => `translate(0, ${i * 20})`,
          rect: {
            $each: ({ d }) => d,
            x: ({ i }) => i * 20,
            y: 0,
            width: 15,
            height: 15,
            fill: ({ parent }) => parent.i === 0 ? 'red' : 'blue',
          },
        },
      });
      expect(result).toContain('fill="red"');
      expect(result).toContain('fill="blue"');
    });
  });

  describe('pretty option', () => {
    it('formats output with indentation', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: { width: 50, height: 50 },
      }, { pretty: true });
      expect(result).toContain('\n');
      expect(result).toContain('  <rect');
    });
  });

  describe('attribute handling', () => {
    it('escapes special characters in attributes', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          'data-info': 'a < b & c > d "quoted"',
          width: 50,
          height: 50,
        },
      });
      expect(result).toContain('data-info="a &lt; b &amp; c &gt; d &quot;quoted&quot;"');
    });

    it('omits null/undefined/false attributes', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          width: 50,
          height: 50,
          fill: null,
          stroke: undefined,
          hidden: false,
        },
      });
      expect(result).not.toContain('fill');
      expect(result).not.toContain('stroke');
      expect(result).not.toContain('hidden');
    });
  });

  describe('context aliases', () => {
    it('provides value alias for d', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: [10, 20],
          width: ({ value }) => value,
          height: 10,
        },
      });
      expect(result).toContain('width="10"');
      expect(result).toContain('width="20"');
    });

    it('provides index alias for i', () => {
      const result = svg({
        width: 100,
        height: 100,
        rect: {
          $each: ['a', 'b'],
          x: ({ index }) => index * 50,
          width: 40,
          height: 40,
        },
      });
      expect(result).toContain('x="0"');
      expect(result).toContain('x="50"');
    });
  });
});
