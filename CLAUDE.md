# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Motif is a tiny (~200 lines) TypeScript library for creating data-driven SVGs with a declarative API. It has zero dependencies.

## Commands

```bash
npm run build       # Compile TypeScript to dist/
npm run dev         # Watch mode compilation
npm run example     # Build and run examples/bar-chart.ts
npm run examples    # Build and run all examples

# Run a single example directly
npx tsx examples/mandala.ts
```

## Architecture

The library exports two main functions:

- **`svg(definition, options)`** - Low-level function that converts a declarative object into an SVG string. Handles element rendering, attribute processing, and iteration.

- **`plot(config, options)`** - High-level charting function with automatic axis scaling, tick generation, and support for scatter, line, bar, and area chart types. Built on top of `svg()`.

### Source Files

- [src/svg.ts](src/svg.ts) - Core rendering engine with `$each`, `$if`, `$text`, `$raw` directives
- [src/plot.ts](src/plot.ts) - Charting layer with scale utilities and axis rendering
- [src/index.ts](src/index.ts) - Re-exports both modules

### Key Concepts

**Context Object** - Functions in definitions receive `{ d, i, data, parent }`:
- `d` (alias `value`) - current data item
- `i` (alias `index`) - current iteration index
- `data` - full array being iterated
- `parent` - parent context for nested `$each`

**Special Directives**:
- `$each` - iterate over array, creating element per item
- `$if` - conditional rendering
- `$text` - text content for `<text>` elements
- `$raw` - inject pre-rendered SVG strings

**Element vs Attribute Keys** - Keys matching SVG element names (`rect`, `circle`, `path`, etc.) create child elements; all other keys become attributes.

## Development

Open `playground.html` in a browser for interactive experimentation - it includes the library inline and several example visualizations.
