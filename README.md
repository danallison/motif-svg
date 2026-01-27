# motif

A tiny library for creating data-driven SVGs with a clean, declarative API.

## Features

- **Declarative syntax** - Define SVGs as plain JavaScript objects
- **Data-driven** - Use `$each` to iterate over data arrays
- **Dynamic values** - Functions receive context and compute values
- **Composable** - Nest definitions and inject pre-rendered SVG with `$raw`
- **High-level charting** - `plot()` function with automatic scaling
- **Zero dependencies** - ~200 lines of code
- **TypeScript support** - Full type definitions included

## Installation

```bash
npm install motif
```

## Quick Start

```typescript
import { svg } from 'motif';

const chart = svg({
  width: 200,
  height: 100,
  circle: {
    $each: [10, 30, 50, 70, 90],
    cx: ({ d }) => d * 2,
    cy: 50,
    r: ({ d }) => d / 5,
    fill: 'steelblue',
  },
});
```

Output:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
  <circle cx="20" cy="50" r="2" fill="steelblue"/>
  <circle cx="60" cy="50" r="6" fill="steelblue"/>
  <circle cx="100" cy="50" r="10" fill="steelblue"/>
  <circle cx="140" cy="50" r="14" fill="steelblue"/>
  <circle cx="180" cy="50" r="18" fill="steelblue"/>
</svg>
```

---

## Core Concepts

### Element Keys

Any valid SVG element name becomes a child element:

```typescript
svg({
  width: 200,
  height: 100,
  rect: { x: 0, y: 0, width: 100, height: 50, fill: 'blue' },
  circle: { cx: 150, cy: 50, r: 25, fill: 'red' },
  g: {
    transform: 'translate(10, 10)',
    path: { d: 'M0 0 L10 10', stroke: 'black' },
  },
});
```

Supported elements include: `svg`, `g`, `defs`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `text`, `tspan`, `image`, `linearGradient`, `radialGradient`, `stop`, `pattern`, `clipPath`, `mask`, `filter`, `fe*` (filter effects), `marker`, `animate`, `animateTransform`, and more.

### Attribute Keys

Any key that isn't an element name becomes an attribute:

```typescript
{
  rect: {
    x: 10,
    y: 20,
    fill: 'blue',
    'stroke-width': 2,     // quote keys with hyphens
    opacity: 0.8,
    transform: 'rotate(45)',
  },
}
```

### Dynamic Values

Functions receive a context object and return computed values:

```typescript
{
  circle: {
    cx: ({ i }) => i * 20,           // i = current index
    cy: ({ d }) => d.y,              // d = current data item
    r: ({ data }) => data.length,    // data = full array
    fill: ({ d, i }) => i % 2 ? 'red' : 'blue',
  },
}
```

---

## Special Directives

### `$each` - Iteration

Repeat an element for each item in an array:

```typescript
{
  rect: {
    $each: [10, 20, 30, 40],
    x: ({ i }) => i * 25,
    width: 20,
    height: ({ d }) => d,
    fill: 'steelblue',
  },
}
```

The context object passed to functions:

| Property | Alias | Description |
|----------|-------|-------------|
| `d` | `value` | Current data item |
| `i` | `index` | Current index (0-based) |
| `data` | - | The full array being iterated |
| `parent` | - | Parent context (for nested `$each`) |

### `$if` - Conditional Rendering

Only render the element if the condition is truthy:

```typescript
{
  circle: {
    $each: points,
    $if: ({ d }) => d.visible,
    cx: ({ d }) => d.x,
    cy: ({ d }) => d.y,
    r: 5,
    fill: 'blue',
  },
}
```

### `$text` - Text Content

Set the text content of a `<text>` element:

```typescript
{
  text: {
    x: 50,
    y: 50,
    'text-anchor': 'middle',
    'font-size': 14,
    $text: ({ d }) => d.label,
  },
}
```

### `$raw` - Inject Raw SVG

Inject a pre-rendered SVG string (useful for composition):

```typescript
// Create reusable icon
const starIcon = svg({
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  polygon: {
    points: '10,2 12,7 18,8 14,12 15,18 10,15 5,18 6,12 2,8 8,7',
    fill: 'gold',
  },
});

// Use it in another SVG
svg({
  width: 200,
  height: 50,
  g: {
    $each: [0, 1, 2, 3, 4],
    transform: ({ i }) => `translate(${i * 40}, 15)`,
    $raw: starIcon,
  },
});
```

---

## Multiple Elements of Same Type

Use arrays when you need multiple elements of the same type with different configurations:

```typescript
{
  circle: [
    { cx: 50, cy: 50, r: 40, fill: 'red' },
    { cx: 50, cy: 50, r: 30, fill: 'white' },
    { cx: 50, cy: 50, r: 20, fill: 'red' },
  ],
  line: [
    { x1: 0, y1: 0, x2: 100, y2: 100, stroke: 'black' },
    { x1: 100, y1: 0, x2: 0, y2: 100, stroke: 'black' },
  ],
}
```

---

## Nested Iteration

Access parent context in nested `$each` loops:

```typescript
const grid = [
  [1, 2, 3],
  [4, 5, 6],
];

svg({
  width: 150,
  height: 100,
  g: {
    $each: grid,
    transform: ({ i }) => `translate(0, ${i * 50})`,
    rect: {
      $each: ({ d }) => d,  // inner array
      x: ({ i }) => i * 50,
      width: 40,
      height: 40,
      fill: ({ d, parent }) => {
        const row = parent.i;  // access outer loop index
        return `hsl(${d * 40 + row * 120}, 70%, 50%)`;
      },
    },
  },
});
```

---

## Gradients and Filters

Define reusable resources in `defs`:

```typescript
svg({
  width: 200,
  height: 100,
  defs: {
    linearGradient: {
      id: 'gradient1',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '0%',
      stop: [
        { offset: '0%', 'stop-color': '#ff6b6b' },
        { offset: '100%', 'stop-color': '#4ecdc4' },
      ],
    },
    filter: {
      id: 'shadow',
      feDropShadow: {
        dx: 2,
        dy: 2,
        stdDeviation: 2,
        'flood-opacity': 0.3,
      },
    },
  },
  rect: {
    x: 20,
    y: 20,
    width: 160,
    height: 60,
    fill: 'url(#gradient1)',
    filter: 'url(#shadow)',
    rx: 10,
  },
});
```

---

## Options

```typescript
svg(definition, {
  pretty: true,  // format output with newlines and indentation
});
```

---

## `plot()` - High-Level Charting

The `plot()` function provides automatic axis scaling, tick generation, and common chart types.

```typescript
import { plot } from 'motif';

const chart = plot({
  width: 400,
  height: 300,
  data: [
    { x: 10, y: 25 },
    { x: 25, y: 45 },
    { x: 40, y: 35 },
    { x: 55, y: 70 },
  ],
  x: d => d.x,
  y: d => d.y,
  type: 'scatter',
  color: 'steelblue',
  title: 'My Chart',
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | required | Chart width in pixels |
| `height` | `number` | required | Chart height in pixels |
| `data` | `T[]` | required | Array of data points |
| `x` | `(d, i) => number \| Date` | required | X-value accessor |
| `y` | `(d, i) => number` | required | Y-value accessor |
| `type` | `string` | `'scatter'` | Chart type: `'scatter'`, `'line'`, `'bar'`, `'area'` |
| `color` | `string \| function` | `'steelblue'` | Static color or `(d, i) => color` |
| `radius` | `number \| function` | `4` | Point radius (scatter only) |
| `margin` | `Partial<Margin>` | auto | `{ top, right, bottom, left }` |
| `xAxis` | `AxisConfig \| false` | `{}` | X-axis config or `false` to hide |
| `yAxis` | `AxisConfig \| false` | `{}` | Y-axis config or `false` to hide |
| `background` | `string` | none | Background fill color |
| `title` | `string` | none | Chart title |

### Axis Configuration

```typescript
interface AxisConfig {
  label?: string;              // Axis label text
  ticks?: number;              // Approximate number of ticks (default: 5)
  format?: (value: number) => string;  // Custom tick format
  grid?: boolean;              // Show grid lines (default: true for y-axis)
}
```

### Chart Types

**Scatter Plot**
```typescript
plot({
  width: 400,
  height: 300,
  data,
  x: d => d.x,
  y: d => d.y,
  type: 'scatter',
  color: (d, i) => `hsl(${i * 30}, 70%, 50%)`,
  radius: (d) => d.size,
});
```

**Line Chart**
```typescript
plot({
  width: 400,
  height: 300,
  data,
  x: d => d.month,
  y: d => d.sales,
  type: 'line',
  color: '#e74c3c',
  xAxis: { label: 'Month' },
  yAxis: { label: 'Sales ($)', grid: true },
});
```

**Bar Chart**
```typescript
plot({
  width: 400,
  height: 300,
  data,
  x: d => d.category,
  y: d => d.value,
  type: 'bar',
  color: (d, i) => ['#3498db', '#e74c3c', '#2ecc71'][i % 3],
});
```

**Area Chart**
```typescript
plot({
  width: 400,
  height: 300,
  data,
  x: d => d.time,
  y: d => d.value,
  type: 'area',
  color: '#3498db',
});
```

---

## TypeScript Types

```typescript
import type {
  Context,
  DynamicValue,
  ElementDefinition,
  SvgDefinition,
  SvgOptions,
  PlotConfig,
  AxisConfig,
  Margin,
} from 'motif';
```

### Context<T>

```typescript
interface Context<T = unknown> {
  d: T;              // Current data item
  value: T;          // Alias for d
  i: number;         // Current index
  index: number;     // Alias for i
  data: T[];         // Full data array
  parent: Context | null;  // Parent context for nested $each
}
```

### DynamicValue<T, R>

A value that can be static or computed from context:

```typescript
type DynamicValue<T, R> = R | ((ctx: Context<T>) => R);
```

---

## Examples

### Animated Progress Ring

```typescript
const progress = 0.75;  // 75%

svg({
  width: 100,
  height: 100,
  circle: [
    // Background ring
    {
      cx: 50,
      cy: 50,
      r: 40,
      fill: 'none',
      stroke: '#eee',
      'stroke-width': 8,
    },
    // Progress ring
    {
      cx: 50,
      cy: 50,
      r: 40,
      fill: 'none',
      stroke: '#4CAF50',
      'stroke-width': 8,
      'stroke-linecap': 'round',
      'stroke-dasharray': `${progress * 251.2} 251.2`,
      transform: 'rotate(-90 50 50)',
    },
  ],
  text: {
    x: 50,
    y: 55,
    'text-anchor': 'middle',
    'font-size': 20,
    'font-weight': 'bold',
    $text: `${Math.round(progress * 100)}%`,
  },
});
```

### Heatmap

```typescript
const data = [
  [1, 3, 5, 7, 9],
  [2, 4, 6, 8, 10],
  [3, 5, 7, 9, 11],
];

svg({
  width: 250,
  height: 150,
  g: {
    $each: data,
    transform: ({ i }) => `translate(0, ${i * 50})`,
    rect: {
      $each: ({ d }) => d,
      x: ({ i }) => i * 50,
      width: 48,
      height: 48,
      fill: ({ d }) => `hsl(${240 - d * 20}, 80%, 50%)`,
      rx: 4,
    },
  },
});
```

### Radial Chart

```typescript
const values = [80, 60, 90, 45, 70];
const TAU = Math.PI * 2;

svg({
  width: 200,
  height: 200,
  g: {
    transform: 'translate(100, 100)',
    path: {
      $each: values,
      d: ({ d, i }) => {
        const angle = (i / values.length) * TAU - TAU / 4;
        const nextAngle = ((i + 1) / values.length) * TAU - TAU / 4;
        const r = d * 0.9;
        const x1 = r * Math.cos(angle);
        const y1 = r * Math.sin(angle);
        const x2 = r * Math.cos(nextAngle);
        const y2 = r * Math.sin(nextAngle);
        return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
      },
      fill: ({ i }) => `hsl(${i * 72}, 70%, 50%)`,
      stroke: 'white',
      'stroke-width': 2,
    },
  },
});
```

### Interactive Legend (with data binding)

```typescript
const items = [
  { label: 'Sales', color: '#3498db', value: 1250 },
  { label: 'Revenue', color: '#2ecc71', value: 890 },
  { label: 'Profit', color: '#e74c3c', value: 340 },
];

svg({
  width: 150,
  height: 80,
  g: {
    $each: items,
    transform: ({ i }) => `translate(0, ${i * 25})`,
    rect: {
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      fill: ({ d }) => d.color,
      rx: 3,
    },
    text: [
      {
        x: 24,
        y: 12,
        'font-size': 12,
        $text: ({ d }) => d.label,
      },
      {
        x: 140,
        y: 12,
        'text-anchor': 'end',
        'font-size': 12,
        'font-weight': 'bold',
        $text: ({ d }) => `$${d.value}`,
      },
    ],
  },
});
```

---

## Tips

1. **Use `pretty: true`** during development to see formatted output
2. **Prefer `$each`** over manual array construction for data-driven elements
3. **Use `parent` context** to access outer loop data in nested iterations
4. **Use `$raw`** to compose pre-built SVG components
5. **Use `$if`** for conditional rendering instead of filtering data
6. **Use `plot()`** for standard charts - it handles scaling automatically

---

## Browser Usage

For browser usage without a bundler, you can embed the library directly:

```html
<script>
  // Minified svg() and plot() functions (~5KB)
  // See playground.html for example
</script>
```

Or use with ES modules:

```html
<script type="module">
  import { svg, plot } from './dist/index.js';

  const chart = svg({ /* ... */ });
  document.body.innerHTML = chart;
</script>
```

---

## License

MIT
