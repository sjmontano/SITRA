# Responsive Design Reference

Deeper material on mobile-first strategy, fluid design, and container queries. Used by the impeccable skill.

---

## Mobile-First vs Content-First

"Mobile-first" as a CSS strategy means writing base styles for the smallest viewport and adding complexity at larger breakpoints with `min-width` queries. This produces leaner CSS because mobile styles are simpler.

```css
/* Mobile-first */
.card {
  display: flex;
  flex-direction: column; /* stacked on mobile */
  padding: 16px;
}

@media (min-width: 640px) {
  .card {
    flex-direction: row; /* side-by-side on larger screens */
    padding: 24px;
  }
}
```

**Content-first** is the design strategy: design for the most constrained context first, then progressively enhance. Not the same as "make the mobile version first" — it means every screen size gets the right experience for that context.

---

## Breakpoint Strategy

Avoid device-specific breakpoints (`768px` = iPad, `1024px` = iPad Pro). Use content-driven breakpoints: the layout breaks when the content breaks.

Tailwind's breakpoints as a reasonable default:

```
sm:  640px   — single column → two column
md:  768px   — compact nav → expanded nav
lg:  1024px  — two column → three column
xl:  1280px  — dense layout available
2xl: 1536px  — max-width containers kick in
```

But don't hesitate to use non-standard breakpoints for specific components:

```css
/* This card switches at 520px, not at a Tailwind breakpoint */
@media (min-width: 520px) {
  .hero-card {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## Container Queries (The Right Tool for Components)

Container queries use the component's container width, not the viewport. This is the correct abstraction for component libraries.

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Card adapts to its container, not the screen */
@container card (min-width: 400px) {
  .card-inner {
    display: grid;
    grid-template-columns: auto 1fr;
  }
}

@container card (max-width: 399px) {
  .card-inner {
    display: flex;
    flex-direction: column;
  }
}
```

In Tailwind (with `@tailwindcss/container-queries` plugin):

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @md:items-center">...</div>
</div>
```

**When to use container queries vs viewport queries:**

- Sidebar card → container query (adapts to sidebar width)
- Navigation → viewport query (adapts to screen width)
- Dashboard widget → container query (adapts to grid column width)
- Hero section → viewport query (adapts to viewport)

---

## Fluid Typography and Spacing

Using `clamp()` for fluid values that scale between viewport widths:

```css
/* Syntax: clamp(min, preferred, max) */
/* preferred = base + scale * 1vw */

.section-padding {
  padding: clamp(2rem, 5vw, 6rem);
}

h1 {
  font-size: clamp(2rem, 5vw, 4rem);
}
```

Calculating the `clamp()` formula: given a min value at viewport W1 and max at W2:

```
slope = (max - min) / (W2 - W1)
intercept = min - slope * W1
preferred = slope * 100vw + intercept
```

Example: heading 2rem at 320px, 4rem at 1440px:

```
slope = (4rem - 2rem) / (1440px - 320px) = 2rem / 1120px ≈ 0.00179
intercept = 2rem - 0.00179 * 320 = 2rem - 0.57rem = 1.43rem
preferred ≈ 0.179rem per 10vw → ~1.79vw + 1.43rem
```

→ `clamp(2rem, 1.79vw + 1.43rem, 4rem)`

Use [Fluid Type Scale Calculator](https://www.fluid-type-scale.com/) for precise values.

---

## Touch Targets

WCAG 2.5.5 (Level AAA) and WCAG 2.5.8 (Level AA, WCAG 2.2) require minimum touch target sizes:

- WCAG 2.5.5: 44×44px
- WCAG 2.5.8: 24×24px minimum (but aim for 44×44px)

```css
/* Visually small button with adequate touch target */
.icon-button {
  width: 24px;
  height: 24px;
  position: relative;
}

.icon-button::before {
  content: '';
  position: absolute;
  inset: -10px; /* extend hit area to 44×44px */
}
```

Or use padding to expand the actual element:

```css
.icon-button {
  padding: 10px; /* 24px icon + 20px padding = 44px */
}
```

---

## Horizontal Scroll Prevention

Horizontal scroll on mobile is almost always unintentional and breaks the experience:

```css
body {
  overflow-x: hidden; /* prevent horizontal scroll on body */
}

img,
video,
iframe,
canvas {
  max-width: 100%; /* prevent media from overflowing */
}

/* Be careful with: absolute/fixed positioning, wide flex items, margin overflow */
```

Diagnosing horizontal scroll:

```js
// DevTools console: find the element causing overflow
document.querySelectorAll('*').forEach((el) => {
  if (el.offsetWidth > document.body.offsetWidth) {
    console.log(el, el.offsetWidth, document.body.offsetWidth)
  }
})
```

---

## Image Responsiveness

```tsx
// Next.js Image component handles srcset, lazy loading, and size negotiation
import Image from 'next/image';

// Fixed size (avatars, logos)
<Image
  src="/avatar.jpg"
  width={64}
  height={64}
  alt="Avatar de Usuario"
/>

// Responsive (hero, card images)
<Image
  src="/hero.jpg"
  fill
  sizes="(min-width: 1024px) 50vw, 100vw"
  alt="Opera Prima event"
  className="object-cover"
/>
```

The `sizes` attribute tells the browser what size the image will render, so it can pick the right file from the srcset. Without `sizes`, the browser assumes `100vw` and downloads a huge file even if the image is 50% width.

---

## Anti-patterns

- **Hiding critical functionality on mobile** — adapt the interface, don't amputate features
- **`display: none` for wide-screen elements** — download the asset, then hide it; use responsive images and loading="lazy" instead
- **Fixed pixel widths on containers** — use `max-width` with `width: 100%`
- **Assuming `768px` = tablet, `1024px` = desktop** — design for content breaks, not device categories
- **Relying on hover for primary actions** — hover doesn't exist on touch; secondary actions revealed on hover must have alternatives
- **14px body text** — minimum 16px on mobile, no exceptions; small text on mobile causes pinch-zoom
- **Viewport `user-scalable=no`** — blocks users who need to zoom; never use it
