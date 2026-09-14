# Color & Contrast Reference

Deeper material on OKLCH, WCAG compliance, and palette construction. Used by the impeccable skill.

---

## Why OKLCH

OKLCH is a perceptually uniform color space. "Perceptually uniform" means: equal steps in lightness _look_ equal, which HSL does not deliver.

In HSL, `hsl(120deg 70% 50%)` and `hsl(240deg 70% 50%)` have the same saturation and lightness values — but green appears much brighter than blue to the human eye. OKLCH corrects for this.

```css
/* HSL: equal values, unequal perceived brightness */
color: hsl(120deg 70% 50%); /* green — looks bright */
color: hsl(240deg 70% 50%); /* blue  — looks dark */

/* OKLCH: equal lightness, truly equal perceived brightness */
color: oklch(0.6 0.18 142); /* green */
color: oklch(0.6 0.18 264); /* blue  — same visual weight */
```

OKLCH syntax: `oklch(L C H)` where:

- **L**: lightness, 0 (black) → 1 (white)
- **C**: chroma, 0 (gray) → ~0.4 (max for most displays)
- **H**: hue angle, 0–360°

---

## Chroma Rules

**Chroma-lightness relationship**: As lightness approaches the extremes (near 0 or near 1), chroma _must_ decrease or the color becomes gamut-busting and either looks wrong or clips on sRGB screens.

| Lightness range | Safe chroma range    |
| --------------- | -------------------- |
| 0.0 – 0.2       | 0 – 0.1              |
| 0.2 – 0.4       | 0 – 0.2              |
| 0.4 – 0.6       | 0 – 0.25 (peak zone) |
| 0.6 – 0.8       | 0 – 0.18             |
| 0.8 – 1.0       | 0 – 0.08             |

When you create light/dark variants of a brand color, reduce chroma as lightness increases:

```css
--brand-base: oklch(0.55 0.22 350); /* vivid brand red */
--brand-light: oklch(0.85 0.08 350); /* light tint, low chroma */
--brand-dark: oklch(0.28 0.12 350); /* dark shade, moderate chroma */
```

---

## Neutral Tinting

Pure grays (`oklch(L 0 0)`) look mechanical and disconnected from brand. Tint them:

```css
/* Tinted neutrals toward brand hue (rosa/coral = ~350°) */
--neutral-50: oklch(0.98 0.005 350);
--neutral-100: oklch(0.95 0.008 350);
--neutral-200: oklch(0.88 0.01 350);
--neutral-300: oklch(0.78 0.012 350);
--neutral-400: oklch(0.65 0.012 350);
--neutral-500: oklch(0.52 0.01 350);
--neutral-600: oklch(0.4 0.01 350);
--neutral-700: oklch(0.3 0.008 350);
--neutral-800: oklch(0.2 0.006 350);
--neutral-900: oklch(0.12 0.005 350);
```

Chroma 0.005–0.015 is barely visible in isolation but creates subconscious cohesion.

---

## color-mix() for Dynamic Variants

CSS `color-mix()` is available in all modern browsers. Use it for tints, shades, and alpha variants without declaring extra tokens:

```css
/* 80% brand + 20% white = light tint */
background: color-mix(in oklch, var(--brand-primary) 80%, white);

/* 70% brand + 30% black = dark shade */
background: color-mix(in oklch, var(--brand-primary) 70%, black);

/* Alpha transparency */
background: color-mix(in oklch, var(--brand-primary) 20%, transparent);
```

Use `in oklch` not `in srgb` — oklch interpolation produces perceptually correct midpoints (no muddy browns when mixing red and green, for example).

---

## WCAG Contrast Requirements

WCAG 2.2 contrast ratios (uses the old luminance formula, not APCA):

| Level | Normal text (<18pt) | Large text (≥18pt or 14pt bold) |
| ----- | ------------------- | ------------------------------- |
| AA    | 4.5:1               | 3:1                             |
| AAA   | 7:1                 | 4.5:1                           |

Practical targets:

- **Body text on background**: aim for 7:1 (AAA) so it's readable on slightly degraded displays
- **UI components and states**: 3:1 minimum (AA large)
- **Placeholder text in inputs**: 4.5:1 minimum (often fails — check it)
- **Disabled states**: no requirement, but aim for perceptible difference

### APCA (Advanced Perceptual Contrast Algorithm)

WCAG 2.x will eventually be replaced by APCA. It's more accurate for modern displays. The threshold for body text is Lc 75 (absolute value), for headlines Lc 60.

Check with: https://www.myndex.com/APCA/

---

## 60-30-10 Distribution

Visual weight distribution, not pixel count:

- **60% neutral/surface**: background, containers, whitespace
- **30% secondary**: body text, borders, secondary UI
- **10% accent**: CTAs, highlights, active states, icons

The accent _works_ because it's the minority. If brand color appears on 40% of the screen, it becomes neutral.

**Tracking brand color usage**: Count distinct interactive elements with brand color vs. total elements. Keep brand color to actions and the most important highlight per screen.

---

## Palette Construction Workflow

1. **Pick the brand hue** — from the logo, brief, or color that represents the brand
2. **Set the brand color** in OKLCH at mid-lightness (0.5–0.6), chroma 0.15–0.25
3. **Generate tints/shades** by varying lightness while reducing chroma at extremes
4. **Tint neutrals** toward the brand hue at chroma 0.005–0.015
5. **Pick accent colors** at 60°–120° hue distance from brand (triadic/split-complementary)
6. **Check contrast** with APCA for all text-on-background combinations
7. **Test gamut** — mark P3-only tokens with `@supports (color: oklch(0 0 0))` fallbacks

---

## Dark Mode Palettes

Avoid inverting the palette (making light colors dark, dark colors light). Instead:

1. **Reduce contrast** slightly — pure white on pure black has too much contrast, causes halation
2. **Raise surface** slightly above true black — `oklch(0.12 0.005 240)` not `oklch(0 0 0)`
3. **Reduce chroma** of accents — vivid colors on dark look aggressive; pull chroma back ~30%
4. **Increase line-height** and letter-spacing for body text (see typography reference)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --surface: oklch(0.12 0.005 350);
    --surface-alt: oklch(0.16 0.005 350);
    --text-primary: oklch(0.92 0.005 350);
    --text-secondary: oklch(0.65 0.008 350);
    /* Accent: reduce chroma vs light mode */
    --accent: oklch(0.65 0.16 350); /* was 0.55 0.22 in light */
  }
}
```

---

## Anti-patterns

- **AI color palette**: Cyan/teal on dark, purple-to-blue gradient, neon on dark → immediately recognizable as AI-generated
- **Pure black text on pure white** (`#000` on `#fff`) — contrast is correct but looks printed, not digital; tint both
- **Gray text on colored backgrounds** — use a shade derived from the background hue
- **Equal-weight multi-color palettes** — every color same saturation/lightness → muddy, no hierarchy
- **Trendy gradient backgrounds** — date your design to a specific year
