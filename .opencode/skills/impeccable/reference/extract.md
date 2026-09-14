# Extract Flow

The extract flow pulls reusable components and design tokens from existing code into the project's design system.

Invoked with: `/impeccable extract [target]`

---

## When to Use Extract

Use extract when:

- You've built something one-off and realize it should be in the design system
- You notice a pattern duplicated across 3+ components
- You want to formalize ad-hoc CSS variables into official tokens
- You're onboarding a new feature area and want to baseline the token set

Do NOT use extract to prematurely abstract things used only once. Extraction adds maintenance surface area — only extract patterns that demonstrably recur.

---

## Step 1: Identify the Target

Parse the extraction target argument. It may be:

- A component name: `/impeccable extract MentorCard`
- A pattern name: `/impeccable extract testimonial-card-pattern`
- A CSS property: `/impeccable extract box-shadow`
- Vague: `/impeccable extract colors from globals.css`

For vague targets, read the specified file and identify the most reusable elements.

---

## Step 2: Audit the Codebase

Search for the target pattern across the codebase. For each occurrence note:

- File path
- Line numbers
- Exact values used (literal pixels, hex codes, etc.)
- Whether they match each other or diverge

```bash
# Example searches
grep -r "box-shadow" src/ --include="*.tsx" --include="*.css"
grep -r "#F65B7F" src/ --include="*.tsx" --include="*.css"
grep -r "brutalist\|offset" src/ --include="*.css"
```

Count: if a pattern appears in 3+ places with identical or near-identical values, it's a candidate for extraction.

---

## Step 3: Propose Tokens

For each identified pattern, propose the canonical token name and value.

Token naming convention:

- Semantic: describes _purpose_ not _value_ (`--shadow-card-hover` not `--shadow-4px-black`)
- Layered: `--[category]-[component?]-[modifier?]`

Examples:

```css
/* Before: literal values scattered in components */
box-shadow: 4px 4px 0 #111111; /* in MentorCard */
box-shadow: 4px 4px 0 #111111; /* in EventCard */
box-shadow: 5px 5px 0 #f65b7f; /* in TestimonialCard hover */

/* After: extracted to tokens */
--shadow-card: 4px 4px 0 #111111;
--shadow-card-hover: 5px 5px 0 var(--brand-primary);
```

---

## Step 4: Update globals.css

Add the new tokens to the `@theme` block in `src/app/globals.css`. Follow the existing token structure.

```css
@theme inline {
  /* existing tokens... */

  /* Extracted: brutalist offset shadows */
  --shadow-card: 4px 4px 0 theme(colors.near-black);
  --shadow-card-hover: 5px 5px 0 theme(colors.near-black);
  --shadow-card-accent: 5px 5px 0 theme(colors.brand-primary);
  --shadow-button: 4px 4px 0 theme(colors.near-black);
}
```

---

## Step 5: Replace Usage Sites

Update each occurrence of the literal value with the token reference. Verify each change doesn't break the visual output.

For CSS files:

```css
/* Before */
.mentor-card:hover {
  box-shadow: 4px 4px 0 #111111;
}

/* After */
.mentor-card:hover {
  box-shadow: var(--shadow-card-hover);
}
```

For Tailwind inline classes, if the token is a Tailwind custom property:

```tsx
// Before
<div className="hover:shadow-[4px_4px_0_#111111]">

// After (if token is in @theme)
<div className="hover:shadow-card-hover">
```

---

## Step 6: Update DESIGN.md

If the extracted tokens are color, typography, spacing, rounded, or component tokens, update `DESIGN.md` in the project root to reflect the new token set.

This keeps the DESIGN.md as the source of truth for the design system state.

---

## Step 7: Verify

1. Run `tsc --noEmit` to verify no TypeScript errors
2. Run `npm run lint` to verify no ESLint errors
3. Visually verify each component that was changed looks identical to before extraction
4. Check that the new token name is semantically meaningful to a developer reading it cold

---

## Component Extraction (vs Token Extraction)

For extracting a full component (not just tokens):

1. **Identify the component**: Find the JSX/TSX pattern that repeats
2. **Define the interface**: What props does the caller need to customize? What's always the same?
3. **Create the component file** in the appropriate `src/components/` subdirectory
4. **Replace usage sites** with the new component
5. **Verify** no visual regressions

Component props guidelines:

- Expose only what differs between usages
- Use discriminated unions for variant patterns (`variant: 'primary' | 'secondary'`)
- Avoid prop drilling — if data needs to go 3+ levels, consider composition patterns instead
