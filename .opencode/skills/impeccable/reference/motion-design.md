# Motion Design Reference

Deeper material on timing, easing functions, and reduced motion. Used by the impeccable skill.

---

## Core Principle: Motion Conveys Meaning

Every animation must answer: what does this teach the user about the relationship between elements? Motion that doesn't answer this question is decoration — and decoration fights with usability.

Useful motion:

- **Entrances/exits**: show where an element comes from and goes to
- **State transitions**: communicate that something changed
- **Causality**: show that action A caused result B (button → modal opens toward the click)
- **Spatial orientation**: show that a panel is behind the current content (parallax)

Decorative motion (avoid):

- Spinning logos
- Hover shimmer effects
- Background particles
- Elements that oscillate perpetually

---

## The Duration Scale

```css
:root {
  --duration-instant: 50ms; /* system feedback (checkbox check) */
  --duration-fast: 100ms; /* micro-interactions (tooltip appear) */
  --duration-normal: 200ms; /* most transitions (hover states) */
  --duration-enter: 300ms; /* entering elements */
  --duration-exit: 200ms; /* exiting (always faster than enter) */
  --duration-page: 400ms; /* page-level transitions */
  --duration-reveal: 600ms; /* content reveals, staggered lists */
  --duration-slow: 800ms; /* emphasis, important reveals */
}
```

**Key rule**: Exits are always faster than entrances. The human eye tracks _incoming_ elements; it dismisses _outgoing_ ones. A modal that exits in 400ms feels sluggish; the same modal entering in 300ms feels intentional.

---

## Easing Functions

Easing functions control acceleration. The right easing matches the physics of the thing being animated.

### The Canonical Set

```css
:root {
  /* Things entering: decelerate as they land */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* expo-out */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot */

  /* Things leaving: accelerate as they go */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0); /* expo-in */

  /* State changes: fast start, fast end */
  --ease-in-out: cubic-bezier(0.83, 0, 0.17, 1); /* expo-in-out */

  /* Spring: for playful, physical feel */
  --ease-spring: linear(
    0,
    0.009,
    0.035 2.1%,
    0.141,
    0.281 6.7%,
    0.723 12.9%,
    0.938 16.7%,
    1.017,
    1.077,
    1.121,
    1.149 24.3%,
    1.159,
    1.163 27%,
    1.154,
    1.129 32.8%,
    1.051 39.6%,
    1.017 43.1%,
    0.991,
    0.977 51%,
    0.974 53.8%,
    0.975 57.1%,
    0.997 69.8%,
    1.003 76.9%,
    1.004 83.8%,
    1
  );
}
```

**Don't use bounce or elastic**: `cubic-bezier` bounce approximations look cheap. The CSS `linear()` spring above is the correct modern approach for physical easing.

### Native CSS Spring (Motion One / Framer Motion)

```ts
// In motion/react (Framer Motion v12)
transition={{
  type: "spring",
  stiffness: 400,
  damping: 30
}}
```

Stiffness 300–500 / damping 25–35 covers most "snappy but not bouncy" use cases.

---

## Transform and Opacity Only

Only animate `transform` and `opacity`. These are the only properties that don't trigger layout recalculation (they run on the GPU compositor thread).

```css
/* ✓ Correct */
transition:
  transform 300ms var(--ease-out),
  opacity 200ms ease;

/* ✗ Avoid — triggers layout */
transition: height 300ms ease;
transition: width 300ms ease;
transition: padding 300ms ease;
transition: margin 300ms ease;
transition: font-size 300ms ease;
```

**Exception — `height` animations**: Use `grid-template-rows` to animate height without triggering layout:

```css
/* Collapsible section */
.collapsible {
  display: grid;
  grid-template-rows: 0fr; /* collapsed */
  transition: grid-template-rows 300ms var(--ease-out);
}
.collapsible.open {
  grid-template-rows: 1fr; /* expanded */
}
.collapsible > * {
  overflow: hidden;
}
```

---

## Staggered Reveals

One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

```ts
// Framer Motion — stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}
```

Stagger timing guide:

- 4–8 items: 80–120ms stagger
- 8–12 items: 40–60ms stagger
- 12+ items: 20–30ms stagger

---

## Reduced Motion

The `prefers-reduced-motion` media query is not optional. Users who set it have vestibular disorders, epilepsy, or simply low battery.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In Framer Motion:

```ts
import { useReducedMotion } from 'framer-motion';

function AnimatedCard() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: prefersReduced ? 0 : 20 }}
      initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
    />
  );
}
```

**Alternative content for reduced motion**: Don't just disable animation. In some cases, a cross-fade is a better alternative than a flying entrance.

---

## Page Transitions (Next.js App Router)

With Next.js App Router, page transitions require the View Transitions API or Framer Motion's `AnimatePresence`.

```tsx
// app/layout.tsx — enable View Transitions API
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <meta name="view-transition" content="same-origin" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

```css
/* Customizing the view transition */
::view-transition-old(root) {
  animation: 200ms ease-out both fade-out;
}
::view-transition-new(root) {
  animation: 300ms ease-out both fade-in;
}
```

---

## Anti-patterns

- **Animations on every interactive element** — motion loses meaning when it's everywhere
- **Linear easing** — objects in physics never accelerate linearly
- **Bounce/elastic easing** — looks cheap, not playful; use spring instead
- **Animating layout properties** — `height`, `width`, `padding` — causes jank
- **Long entrance animations** — >500ms makes the UI feel slow, not polished
- **Identical stagger amounts for any list length** — large lists with 100ms stagger take 10 seconds to fully reveal
