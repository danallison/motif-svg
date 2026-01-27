/**
 * declarative-svg
 * A lightweight library for creating data-driven SVGs
 */

// All valid SVG element names
const SVG_ELEMENTS = new Set([
  'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc',
  'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path',
  'text', 'tspan', 'textPath',
  'image', 'foreignObject',
  'linearGradient', 'radialGradient', 'stop', 'pattern',
  'clipPath', 'mask', 'filter',
  'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDropShadow', 'feFlood', 'feGaussianBlur', 'feImage', 'feMerge',
  'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting',
  'feTile', 'feTurbulence', 'marker', 'animate', 'animateMotion',
  'animateTransform', 'set', 'a',
]);

// Special keys that aren't attributes
const SPECIAL_KEYS = new Set(['$each', '$if', '$text', '$key', '$raw']);

/**
 * Context passed to dynamic value functions
 */
export interface Context<T = unknown> {
  /** Current data item (alias: value) */
  d: T;
  /** Current data item */
  value: T;
  /** Current index (alias: index) */
  i: number;
  /** Current index */
  index: number;
  /** Full data array */
  data: T[];
  /** Parent iteration context (for nested $each) */
  parent: Context | null;
}

/**
 * A dynamic value - either static or a function that computes the value
 */
export type DynamicValue<T, R> = R | ((ctx: Context<T>) => R);

/**
 * Base element definition with special keys
 */
export interface ElementDefinition<T = unknown> {
  /** Iterate over array, creating element for each item */
  $each?: T[] | ((ctx: Context) => T[]);
  /** Conditional rendering */
  $if?: DynamicValue<T, boolean>;
  /** Text content for text elements */
  $text?: DynamicValue<T, string | number>;
  /** Key for reconciliation (unused currently, reserved) */
  $key?: DynamicValue<T, string | number>;
  /** Raw SVG/HTML string to inject (not escaped) */
  $raw?: DynamicValue<T, string>;
  /** Any SVG attribute or child element */
  [key: string]: unknown;
}

/**
 * SVG definition - the root element
 */
export interface SvgDefinition extends ElementDefinition {
  width?: DynamicValue<unknown, number | string>;
  height?: DynamicValue<unknown, number | string>;
  viewBox?: DynamicValue<unknown, string>;
}

/**
 * Render options
 */
export interface SvgOptions {
  /** Format output with newlines and indentation */
  pretty?: boolean;
}

interface RenderOptions extends SvgOptions {
  indent: number;
}

function escapeAttr(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isElement(key: string): boolean {
  return SVG_ELEMENTS.has(key);
}

function isAttribute(key: string): boolean {
  return !isElement(key) && !SPECIAL_KEYS.has(key) && !key.startsWith('$');
}

/**
 * Evaluate a value - if it's a function, call it with context
 */
function evaluate<T, R>(value: DynamicValue<T, R>, ctx: Context<T>): R {
  return typeof value === 'function'
    ? (value as (ctx: Context<T>) => R)(ctx)
    : value;
}

/**
 * Render a single element
 */
function renderElement(
  tagName: string,
  definition: ElementDefinition,
  ctx: Context,
  options: RenderOptions
): string {
  const { pretty, indent } = options;
  const nl = pretty ? '\n' : '';
  const pad = pretty ? '  '.repeat(indent) : '';

  // Handle $if conditional
  if (definition.$if !== undefined) {
    const condition = evaluate(definition.$if, ctx);
    if (!condition) return '';
  }

  // Collect attributes and child elements
  const attributes: string[] = [];
  const children: Array<{ tagName: string; definition: unknown }> = [];
  let textContent = '';
  let rawContent = '';

  for (const [key, value] of Object.entries(definition)) {
    if (SPECIAL_KEYS.has(key)) {
      if (key === '$text') {
        textContent = escapeText(evaluate(value as DynamicValue<unknown, string | number>, ctx));
      } else if (key === '$raw') {
        rawContent = evaluate(value as DynamicValue<unknown, string>, ctx) || '';
      }
      continue;
    }

    if (isElement(key)) {
      children.push({ tagName: key, definition: value });
    } else if (isAttribute(key)) {
      const attrValue = evaluate(value as DynamicValue<unknown, unknown>, ctx);
      if (attrValue !== null && attrValue !== undefined && attrValue !== false) {
        attributes.push(`${key}="${escapeAttr(attrValue)}"`);
      }
    }
  }

  const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';

  // Render children
  let childrenStr = '';
  for (const child of children) {
    childrenStr += renderNode(child.tagName, child.definition, ctx, {
      ...options,
      indent: indent + 1,
    });
  }

  if (tagName === 'text' && textContent) {
    return `${pad}<${tagName}${attrStr}>${textContent}</${tagName}>${nl}`;
  }

  // Combine all inner content
  const hasContent = childrenStr || textContent || rawContent;

  if (hasContent) {
    const textPad = pretty ? '  '.repeat(indent + 1) : '';
    const rawPad = pretty && rawContent ? textPad : '';
    const rawNl = pretty && rawContent ? nl : '';
    return `${pad}<${tagName}${attrStr}>${nl}${childrenStr}${textContent ? textPad + textContent + nl : ''}${rawContent ? rawPad + rawContent + rawNl : ''}${pad}</${tagName}>${nl}`;
  } else {
    return `${pad}<${tagName}${attrStr}/>${nl}`;
  }
}

/**
 * Render a node (handles $each iteration)
 */
function renderNode(
  tagName: string,
  definition: unknown,
  ctx: Context,
  options: RenderOptions
): string {
  if (Array.isArray(definition)) {
    return definition.map(def => renderNode(tagName, def, ctx, options)).join('');
  }

  if (typeof definition !== 'object' || definition === null) {
    const value = typeof definition === 'function' ? definition(ctx) : definition;
    const pad = options.pretty ? '  '.repeat(options.indent) : '';
    const nl = options.pretty ? '\n' : '';
    return `${pad}<${tagName}>${escapeText(value)}</${tagName}>${nl}`;
  }

  const def = definition as ElementDefinition;

  // Handle $each iteration
  if (def.$each !== undefined) {
    const dataSource = evaluate(def.$each as DynamicValue<unknown, unknown[]>, ctx);
    if (!Array.isArray(dataSource)) {
      console.warn('$each must be an array, got:', dataSource);
      return '';
    }

    const { $each, ...restDefinition } = def;

    return dataSource.map((item, index) => {
      const iterCtx: Context = {
        value: item,
        index,
        data: dataSource,
        parent: ctx,
        d: item,
        i: index,
      };
      return renderElement(tagName, restDefinition, iterCtx, options);
    }).join('');
  }

  return renderElement(tagName, def, ctx, options);
}

/**
 * Create an empty context
 */
function createEmptyContext(): Context {
  return {
    d: null,
    value: null,
    i: 0,
    index: 0,
    data: [],
    parent: null,
  };
}

/**
 * Render SVG from definition
 *
 * @param definition - The SVG definition object
 * @param options - Render options
 * @returns SVG string
 *
 * @example
 * ```ts
 * const chart = svg({
 *   width: 200,
 *   height: 100,
 *   circle: {
 *     $each: [10, 30, 50],
 *     cx: ({ d }) => d * 2,
 *     cy: 50,
 *     r: ({ d }) => d / 5,
 *     fill: 'steelblue',
 *   },
 * });
 * ```
 */
export function svg(definition: SvgDefinition, options: SvgOptions = {}): string {
  const { pretty = false } = options;

  const ctx = createEmptyContext();
  const rootDef = { xmlns: 'http://www.w3.org/2000/svg', ...definition };

  return renderElement('svg', rootDef, ctx, { pretty, indent: 0 }).trim();
}
