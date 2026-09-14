# Spatial Design Reference

Deeper material on grids, containers, optical adjustments, and layout rhythm. Used by the impeccable skill.

---

## The 4pt Spacing Scale

All spacing should come from a 4pt base scale. This aligns to the 4px grid used by most devices' pixel densities and produces consistent visual rhythm.

```css
:root {
  --space-1: 4px; /* hairline gap, icon margin */
  --space-2: 8px; /* tight grouping, icon padding */
  --space-3: 12px; /* list item gap, compact padding */
  --space-4: 16px; /* base padding, standard gap */
  --space-6: 24px; /* card padding, section gaps */
  --space-8: 32px; /* section padding */
  --space-12: 48px; /* large section gap */
  --space-16: 64px; /* XL section gap */
  --space-24: 96px; /* hero/section padding */
}
```

**Why not 8pt?** At 8pt, the steps between 8px and 16px, 16px and 32px are too large. You'll constantly want 12px between a heading and its paragraph — a value that doesn't exist on an 8pt scale.

**Use semantic tokens**: `--space-card-padding` not `--space-6`. When the design system evolves, you update one token instead of hunting for every `--space-6`.

---

## CSS Grid Fundamentals

### Auto-fit vs Auto-fill

```css
/* auto-fit: columns collapse when there's only 1 item */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

/* auto-fill: empty grid tracks are preserved */
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
```

Use `auto-fit` for card grids. Use `auto-fill` when you want placeholder columns to show the grid structure.

### Named Grid Lines

```css
.layout {
  display: grid;
  grid-template-columns:
    [full-start] minmax(1rem, 1fr)
    [content-start] min(65ch, calc(100% - 2rem))
    [content-end] minmax(1rem, 1fr)
    [full-end];
}

.full-bleed {
  grid-column: full-start / full-end;
}
.content {
  grid-column: content-start / content-end;
}
```

This is the "full-bleed layout trick" — a single container handles both full-width sections and constrained content.

### Subgrid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.card {
  display: grid;
  grid-template-rows: subgrid; /* align internal rows to parent grid */
  grid-row: span 4;
}
```

Subgrid aligns internal rows of cards (image, title, description, action) across all cards — no JS required.

---

## Container Queries

Container queries respond to the container's inline size, not the viewport. The correct mental model:

- **Viewport queries**: page-level layout (sidebar on/off, navbar breakpoints)
- **Container queries**: component-level adaptation (card layout, sidebar card vs full-width card)

```css
/* Define a containment context */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Adapt the card based on its container width */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 120px 1fr; /* wide layout */
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column; /* stacked layout */
  }
}
```

---

## Optical Adjustments

Geometry is not perception. A square with `padding: 16px` on all sides looks like it has more padding at the bottom. These corrections make interfaces feel _right_ rather than merely correct.

### Icon Optical Centering

Icons with inherent visual weight (outlined shapes, logos with ascenders) look off-center when mathematically centered. Shift them 1–2px in the direction of their visual weight:

```css
/* Logo has more visual weight on the left */
.icon-centered {
  transform: translateX(1px);
}
```

### Text in Containers

Text with descenders (g, p, y) and ascenders (h, l, b) has unequal visual space above and below. Add slightly more padding-bottom than padding-top for centered text:

```css
.button {
  padding: 10px 20px 12px; /* 2px extra bottom for visual centering */
}
```

### Cap-height vs x-height Alignment

When aligning an icon to text, align to the **cap-height** or **x-height**, not the text box bounds. The `cap` and `ex` CSS units help:

```css
.icon-inline {
  height: 1cap; /* matches capital letter height */
  width: 1cap;
  vertical-align: text-bottom;
}
```

### Border Radius Nesting

When nesting a rounded element inside another, the inner radius should be: `outer-radius - gap`. Otherwise the corner looks wrong.

```css
.outer {
  border-radius: 16px;
  padding: 8px;
}

.inner {
  border-radius: calc(16px - 8px); /* = 8px */
}
```

---

## Visual Rhythm

Rhythm comes from consistent spacing intervals, not identical spacing everywhere. Like music: silence (large space) creates emphasis; beat (small space) creates grouping.

**Proximity principle**: Items that belong together should be spaced closer to each other than to unrelated items. A card's label and title should be 4px apart; the title and description 8px; the description and action 24px.

```css
/* Using custom properties for semantic spacing */
.card-header {
  gap: var(--space-1); /* tight: label + title */
}
.card-body {
  margin-top: var(--space-3); /* medium: body follows header */
  gap: var(--space-2); /* tight: lines within body */
}
.card-footer {
  margin-top: var(--space-6); /* generous: action follows body */
}
```

---

## Asymmetry and Grid Breaking

The grid is a system for creating consistent _relationships_, not a constraint that every element must respect. Intentional breakouts create emphasis.

Techniques:

- **Negative margin**: Pull an element outside its container
- **Position sticky/absolute**: Layer elements over the grid
- **Transform translate**: Shift by a fixed amount without affecting document flow
- **z-index stacking**: Overlap elements to imply depth

Use these sparingly. One strong breakout per section creates emphasis; five breakouts creates chaos.

---

## Anti-patterns

- **Uniform padding on everything** — makes every element feel equally important
- **Wrapping everything in cards** — containers imply grouping; don't group ungrouped things
- **Nested cards** — visual noise without hierarchy benefit; flatten
- **Identical card grids** — same-sized cards repeated with icon+title+text format looks AI-generated
- **Hero metric layout** — large number + small label + supporting stats + gradient accent is now a template
- **Centering everything** — left-aligned asymmetric layouts feel more intentional
- **Max-width on containers but not text** — set `max-width: 65ch` on body text, not just the layout container
