/**
 * plot() - High-level charting function with automatic scaling
 */

import { svg, type SvgOptions } from './svg.js';

// ============================================
// Types
// ============================================

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AxisConfig {
  /** Axis label */
  label?: string;
  /** Number of ticks (approximate) */
  ticks?: number;
  /** Custom tick format function */
  format?: (value: number) => string;
  /** Show grid lines */
  grid?: boolean;
}

export interface PlotConfig<T = unknown> {
  /** Chart width */
  width: number;
  /** Chart height */
  height: number;
  /** Data array */
  data: T[];
  /** X accessor - returns number or Date */
  x: (d: T, i: number) => number | Date;
  /** Y accessor - returns number */
  y: (d: T, i: number) => number;
  /** Chart type */
  type?: 'scatter' | 'line' | 'bar' | 'area';
  /** Point/bar color - static or per-datum */
  color?: string | ((d: T, i: number) => string);
  /** Point radius for scatter plots */
  radius?: number | ((d: T, i: number) => number);
  /** Margins around the plot area */
  margin?: Partial<Margin>;
  /** X-axis configuration */
  xAxis?: AxisConfig | false;
  /** Y-axis configuration */
  yAxis?: AxisConfig | false;
  /** Background color */
  background?: string;
  /** Title */
  title?: string;
}

// ============================================
// Scale utilities
// ============================================

function extent(values: number[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

function niceScale(min: number, max: number, maxTicks: number = 5): { min: number; max: number; step: number } {
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  return { min: niceMin, max: niceMax, step };
}

function generateTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  for (let v = min; v <= max + step * 0.5; v += step) {
    ticks.push(Math.round(v * 1e10) / 1e10); // Fix floating point
  }
  return ticks;
}

function createLinearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const scale = (r1 - r0) / (d1 - d0 || 1);

  return (value: number): number => {
    return r0 + (value - d0) * scale;
  };
}

function defaultFormat(value: number): string {
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
}

// ============================================
// Plot function
// ============================================

export function plot<T>(config: PlotConfig<T>, options: SvgOptions = {}): string {
  const {
    width,
    height,
    data,
    x: xAccessor,
    y: yAccessor,
    type = 'scatter',
    color = 'steelblue',
    radius = 4,
    margin: marginConfig = {},
    xAxis: xAxisConfig = {},
    yAxis: yAxisConfig = {},
    background,
    title,
  } = config;

  // Merge margins with defaults
  const margin: Margin = {
    top: title ? 40 : 20,
    right: 20,
    bottom: xAxisConfig !== false && (xAxisConfig as AxisConfig).label ? 50 : 35,
    left: yAxisConfig !== false && (yAxisConfig as AxisConfig).label ? 60 : 45,
    ...marginConfig,
  };

  // Calculate plot area dimensions
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Extract data values
  const xValues = data.map((d, i) => {
    const v = xAccessor(d, i);
    return v instanceof Date ? v.getTime() : v;
  });
  const yValues = data.map((d, i) => yAccessor(d, i));

  // Compute scales
  const [xMin, xMax] = extent(xValues);
  const [yMin, yMax] = extent(yValues);

  // For bar charts, y should start at 0
  const yDomainMin = type === 'bar' ? Math.min(0, yMin) : yMin;

  const xNice = niceScale(xMin, xMax, (xAxisConfig as AxisConfig)?.ticks ?? 5);
  const yNice = niceScale(yDomainMin, yMax, (yAxisConfig as AxisConfig)?.ticks ?? 5);

  const xScale = createLinearScale([xNice.min, xNice.max], [0, plotWidth]);
  const yScale = createLinearScale([yNice.min, yNice.max], [plotHeight, 0]);

  const xTicks = generateTicks(xNice.min, xNice.max, xNice.step);
  const yTicks = generateTicks(yNice.min, yNice.max, yNice.step);

  const xFormat = (xAxisConfig as AxisConfig)?.format ?? defaultFormat;
  const yFormat = (yAxisConfig as AxisConfig)?.format ?? defaultFormat;

  // Build chart elements
  const elements: Record<string, unknown> = {};

  // Background
  if (background) {
    elements.rect = {
      width,
      height,
      fill: background,
    };
  }

  // Title
  if (title) {
    elements.text = {
      x: width / 2,
      y: 24,
      'text-anchor': 'middle',
      'font-size': 16,
      'font-weight': 'bold',
      fill: '#333',
      $text: title,
    };
  }

  // Main plot group
  const plotGroup: Record<string, unknown> = {
    transform: `translate(${margin.left}, ${margin.top})`,
  };

  // Grid lines
  const gridLines: unknown[] = [];

  if (yAxisConfig !== false && (yAxisConfig as AxisConfig).grid !== false) {
    gridLines.push({
      line: {
        $each: yTicks,
        x1: 0,
        y1: ({ d }: { d: number }) => yScale(d),
        x2: plotWidth,
        y2: ({ d }: { d: number }) => yScale(d),
        stroke: '#e0e0e0',
        'stroke-width': 1,
      },
    });
  }

  if (xAxisConfig !== false && (xAxisConfig as AxisConfig).grid) {
    gridLines.push({
      line: {
        $each: xTicks,
        x1: ({ d }: { d: number }) => xScale(d),
        y1: 0,
        x2: ({ d }: { d: number }) => xScale(d),
        y2: plotHeight,
        stroke: '#e0e0e0',
        'stroke-width': 1,
      },
    });
  }

  if (gridLines.length > 0) {
    plotGroup.g = gridLines;
  }

  // Data visualization based on type
  const getColor = typeof color === 'function'
    ? (d: T, i: number) => color(d, i)
    : () => color;

  const getRadius = typeof radius === 'function'
    ? (d: T, i: number) => radius(d, i)
    : () => radius;

  if (type === 'scatter') {
    plotGroup.circle = {
      $each: data,
      cx: ({ d, i }: { d: T; i: number }) => xScale(xValues[i]),
      cy: ({ d, i }: { d: T; i: number }) => yScale(yValues[i]),
      r: ({ d, i }: { d: T; i: number }) => getRadius(d, i),
      fill: ({ d, i }: { d: T; i: number }) => getColor(d, i),
    };
  } else if (type === 'line' || type === 'area') {
    // Build path
    const points = data.map((d, i) => ({
      x: xScale(xValues[i]),
      y: yScale(yValues[i]),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    if (type === 'area') {
      const areaPath = linePath + ` L ${points[points.length - 1].x} ${plotHeight} L ${points[0].x} ${plotHeight} Z`;
      plotGroup.path = [
        {
          d: areaPath,
          fill: typeof color === 'string' ? color : 'steelblue',
          opacity: 0.3,
        },
        {
          d: linePath,
          fill: 'none',
          stroke: typeof color === 'string' ? color : 'steelblue',
          'stroke-width': 2,
        },
      ];
    } else {
      plotGroup.path = {
        d: linePath,
        fill: 'none',
        stroke: typeof color === 'string' ? color : 'steelblue',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      };
    }

    // Add dots at data points
    plotGroup.circle = {
      $each: data,
      cx: ({ i }: { i: number }) => xScale(xValues[i]),
      cy: ({ i }: { i: number }) => yScale(yValues[i]),
      r: 3,
      fill: typeof color === 'string' ? color : 'steelblue',
    };
  } else if (type === 'bar') {
    const barWidth = Math.max(1, (plotWidth / data.length) * 0.8);
    const barGap = (plotWidth / data.length) * 0.1;

    plotGroup.rect = {
      $each: data,
      x: ({ i }: { i: number }) => xScale(xValues[i]) - barWidth / 2,
      y: ({ i }: { i: number }) => Math.min(yScale(yValues[i]), yScale(0)),
      width: barWidth,
      height: ({ i }: { i: number }) => Math.abs(yScale(yValues[i]) - yScale(0)),
      fill: ({ d, i }: { d: T; i: number }) => getColor(d, i),
      rx: 2,
    };
  }

  // X-axis
  if (xAxisConfig !== false) {
    const xAxisGroup: Record<string, unknown> = {
      transform: `translate(0, ${plotHeight})`,
      line: {
        x1: 0,
        y1: 0,
        x2: plotWidth,
        y2: 0,
        stroke: '#333',
        'stroke-width': 1,
      },
    };

    // Tick marks and labels
    xAxisGroup.g = {
      $each: xTicks,
      transform: ({ d }: { d: number }) => `translate(${xScale(d)}, 0)`,
      line: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 5,
        stroke: '#333',
      },
      text: {
        x: 0,
        y: 18,
        'text-anchor': 'middle',
        'font-size': 11,
        fill: '#666',
        $text: ({ d }: { d: number }) => xFormat(d),
      },
    };

    // Axis label
    if ((xAxisConfig as AxisConfig).label) {
      xAxisGroup.text = {
        x: plotWidth / 2,
        y: 38,
        'text-anchor': 'middle',
        'font-size': 12,
        fill: '#333',
        $text: (xAxisConfig as AxisConfig).label,
      };
    }

    if (!plotGroup.g) plotGroup.g = [];
    (plotGroup.g as unknown[]).push(xAxisGroup);
  }

  // Y-axis
  if (yAxisConfig !== false) {
    const yAxisGroup: Record<string, unknown> = {
      line: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: plotHeight,
        stroke: '#333',
        'stroke-width': 1,
      },
    };

    // Tick marks and labels
    yAxisGroup.g = {
      $each: yTicks,
      transform: ({ d }: { d: number }) => `translate(0, ${yScale(d)})`,
      line: {
        x1: -5,
        y1: 0,
        x2: 0,
        y2: 0,
        stroke: '#333',
      },
      text: {
        x: -8,
        y: 4,
        'text-anchor': 'end',
        'font-size': 11,
        fill: '#666',
        $text: ({ d }: { d: number }) => yFormat(d),
      },
    };

    // Axis label
    if ((yAxisConfig as AxisConfig).label) {
      yAxisGroup.text = {
        x: 0,
        y: 0,
        transform: `translate(-40, ${plotHeight / 2}) rotate(-90)`,
        'text-anchor': 'middle',
        'font-size': 12,
        fill: '#333',
        $text: (yAxisConfig as AxisConfig).label,
      };
    }

    if (!plotGroup.g) plotGroup.g = [];
    (plotGroup.g as unknown[]).push(yAxisGroup);
  }

  elements.g = plotGroup;

  return svg(
    {
      width,
      height,
      style: 'font-family: system-ui, sans-serif;',
      ...elements,
    },
    options
  );
}
