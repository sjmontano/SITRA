# Typography Reference

Deeper material on OpenType features, font loading strategy, and scale construction. Used by the impeccable skill.

---

## Font Loading Strategy

### Variable Fonts First

Prefer variable fonts. One file replaces a font family, eliminates FOUT jitter from multiple requests, and lets you animate weight/width continuously.

```css
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/Poppins-VF.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap; /* swap = no invisible text during load */
}
```

`font-display: swap` is mandatory for body text. Use `optional` for decorative display fonts that are non-critical (if they don't load in time, the user doesn't wait).

### Preloading Critical Fonts

Preload only the single font file used above the fold. Preloading every font defeats the purpose.

```html
<link rel="preload" href="/fonts/Poppins-VF.woff2" as="font" type="font/woff2" crossorigin />
```

If using Next.js, use `next/font` — it inlines the @font-face, scopes the font to your app, and automatically serves from Vercel's CDN with correct caching headers.

---

## Fluid Type Scale with `clamp()`

Use `clamp(min, preferred, max)` on headings for marketing pages and landing pages. The preferred value is a viewport-relative expression.

```css
:root {
  --text-xs: clamp(0.69rem, 0.66rem + 0.18vw, 0.8rem);
  --text-sm: clamp(0.83rem, 0.78rem + 0.29vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.29vw, 1.125rem);
  --text-lg: clamp(1.2rem, 1.14rem + 0.35vw, 1.375rem);
  --text-xl: clamp(1.44rem, 1.35rem + 0.5vw, 1.75rem);
  --text-2xl: clamp(1.73rem, 1.62rem + 0.7vw, 2.25rem);
  --text-3xl: clamp(2.07rem, 1.92rem + 0.87vw, 2.75rem);
  --text-4xl: clamp(2.49rem, 2.28rem + 1.1vw, 3.5rem);
  --text-display: clamp(3rem, 2.7rem + 1.5vw, 6rem);
}
```

**For product UIs, dashboards, admin panels**: use fixed `rem` scales. Fluid type in dense app UIs causes layout instability as users resize windows. Use `clamp()` only where the viewport itself is the canvas (marketing, landing, editorial).

---

## Modular Scale Construction

A modular scale multiplies a base size by a ratio. Common ratios:

| Ratio | Name           | Use case                          |
| ----- | -------------- | --------------------------------- |
| 1.067 | Minor second   | Very tight scales, data-dense UIs |
| 1.125 | Major second   | Compact app UIs                   |
| 1.25  | Major third    | Most UI work — enough contrast    |
| 1.333 | Perfect fourth | Marketing pages, editorial        |
| 1.5   | Perfect fifth  | Hero sections, large displays     |
| 1.618 | Golden ratio   | Display-only, not for long scales |

Generating a 6-step scale at 1.333 from 1rem base:

```
1rem × 1.333⁰ = 1rem      (base)
1rem × 1.333¹ = 1.333rem  (large)
1rem × 1.333² = 1.777rem  (xl)
1rem × 1.333³ = 2.369rem  (2xl)
1rem × 1.333⁴ = 3.157rem  (3xl)
1rem × 1.333⁵ = 4.209rem  (display)
```

**Don't use all steps**. A 4-step scale used consistently is more legible than an 8-step scale used inconsistently.

---

## OpenType Features

Turn on features that improve readability. CSS property: `font-feature-settings` or the modern `font-variant-*` properties.

```css
body {
  font-feature-settings:
    'kern' 1,
    'liga' 1,
    'calt' 1;
  /* kerning, standard ligatures, contextual alternates */
}

.numerals {
  font-variant-numeric: oldstyle-nums proportional-nums;
  /* Old-style figures in body text look more literary */
}

.table-numerals {
  font-variant-numeric: tabular-nums;
  /* Monospaced digits for tables/data */
}
```

Common useful features:

- `kern` — Letter-pair spacing adjustments (almost always on)
- `liga` — Standard ligatures (fi, fl, ff)
- `calt` — Contextual alternates
- `ss01`–`ss20` — Stylistic sets (inspect the font with Wakamai Fondue or Fontdrop.info)
- `case` — Case-sensitive forms (parentheses, hyphens position higher for all-caps text)

---

## Line Length Control

```css
.prose {
  max-width: 70ch; /* ~70 characters per line */
}

.narrow-column {
  max-width: 52ch; /* Narrow editorial column */
}

.wide-editorial {
  max-width: 80ch; /* Upper limit for justified text */
}
```

The `ch` unit equals the width of the `0` glyph in the current font. It's not exact — multiply by 0.9–0.95 for precise control — but it's robust and responsive.

---

## Vertical Rhythm

Use a baseline grid of 4px or 8px. All spacing and line-heights should hit multiples of the baseline.

```css
:root {
  --baseline: 4px;
  --line-height-tight: 1.1; /* headings */
  --line-height-normal: 1.5; /* UI text */
  --line-height-loose: 1.7; /* body prose */
  --line-height-spacious: 1.9; /* editorial long-form */
}
```

**Line-height inversion rule**: Short lines → loose leading. Wide lines → normal leading. Large type → tight leading (display headings often use 0.9–1.1).

---

## Text on Dark Backgrounds

Light text on dark backgrounds reads as visually lighter weight — the same font-weight appears thinner against dark. Compensate:

1. Increase `line-height` by 0.05–0.1 vs the same text on light
2. Increase `font-weight` by one step (400 → 500, 500 → 600) where variable fonts allow
3. Slightly increase letter-spacing (+0.01em) for small text

---

## Anti-patterns

- **All-caps for entire paragraphs** — readable only for 2–4 word labels
- **Centered long-form text** — exhausting to read; center only for 1–3 line display headings
- **Mixing 3+ type families** — one for display, one for body, one for code/mono is the absolute max
- **Type weight as the only differentiator** — combine weight with size and color for richer hierarchy
- **Defaulting to bold for emphasis** — in dark/heavy designs, bold emphasizes nothing; use color or size
