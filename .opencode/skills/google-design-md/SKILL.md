---
name: google-design-md
description: Create, validate, and export DESIGN.md files — Google's machine-readable design token format for AI agents. Use when creating a DESIGN.md for a project, updating design tokens, exporting to Tailwind/DTCG, or linting a design system file.
version: 1.0.0
user-invocable: true
argument-hint: '[create|lint|export]'
source: https://github.com/google-labs-code/design.md
license: Apache 2.0
---

# DESIGN.md Skill

A **DESIGN.md** file combines machine-readable design tokens (YAML front matter) with human-readable design rationale (Markdown prose). It gives AI agents a persistent, structured understanding of a design system.

## Format

```yaml
---
version: alpha
name: <ProjectName>
description: <one-line summary> # optional

colors:
  primary: '#hex'
  secondary: '#hex'
  # ... more color tokens

typography:
  h1:
    fontFamily: <string>
    fontSize: <dimension>
    fontWeight: <number>
    lineHeight: <number>
    letterSpacing: <dimension>
  body-md:
    fontFamily: <string>
    fontSize: <dimension>
  # ... more type tokens

rounded:
  sm: <dimension>
  md: <dimension>
  lg: <dimension>

spacing:
  sm: <dimension>
  md: <dimension>
  lg: <dimension>

components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
    rounded: '{rounded.sm}'
    padding: 12px
  button-primary-hover:
    backgroundColor: '{colors.secondary}'
---
```

## Token Types

| Type            | Format                                                                  | Example            |
| --------------- | ----------------------------------------------------------------------- | ------------------ |
| Color           | `# + hex (sRGB)`                                                        | `"#1A1C1E"`        |
| Dimension       | `number + unit`                                                         | `48px`, `-0.02em`  |
| Token Reference | `{path.to.token}`                                                       | `{colors.primary}` |
| Typography      | object with fontFamily, fontSize, fontWeight, lineHeight, letterSpacing | See above          |

## Section Order (canonical)

1. `## Overview` — Brand & Style rationale
2. `## Colors` — Palette descriptions
3. `## Typography` — Font decisions and scales
4. `## Layout` — Grid and spacing
5. `## Elevation & Depth`
6. `## Shapes`
7. `## Components`
8. `## Do's and Don'ts`

Sections can be omitted. Unknown sections are preserved.

## CLI Reference

```bash
# Validate a DESIGN.md
npx @google/design.md lint DESIGN.md

# Compare two versions
npx @google/design.md diff DESIGN.md DESIGN-v2.md

# Export to Tailwind theme config
npx @google/design.md export --format tailwind DESIGN.md > tailwind.theme.json

# Export to W3C DTCG tokens.json
npx @google/design.md export --format dtcg DESIGN.md > tokens.json
```

## Linting Rules

| Rule                 | Severity | What it checks                                        |
| -------------------- | -------- | ----------------------------------------------------- |
| `broken-ref`         | error    | Token references that don't resolve                   |
| `missing-primary`    | warning  | Colors defined but no `primary` exists                |
| `contrast-ratio`     | warning  | Component text/background pairs below WCAG AA (4.5:1) |
| `orphaned-tokens`    | warning  | Color tokens never referenced by any component        |
| `token-summary`      | info     | Count of tokens per section                           |
| `missing-sections`   | info     | Optional sections absent                              |
| `missing-typography` | warning  | Colors defined but no typography tokens               |
| `section-order`      | warning  | Sections out of canonical order                       |

## When Creating a DESIGN.md

1. **Gather brand context** — colors, fonts, component styles already in use
2. **Extract tokens** from existing CSS variables / Tailwind config
3. **Write rationale prose** for each section: explain _why_ tokens have those values
4. **Reference tokens in components** using `{path.to.token}` syntax
5. **Lint** with `npx @google/design.md lint DESIGN.md`

## Opera Prima DESIGN.md Location

The project's design file lives at `DESIGN.md` in the project root. It should reflect:

- Brand colors: `#F65B7F` (rosa), `#1A4A3C` (verde selva), `#5E3A8A` (lavanda)
- Near-black: `#111111` for brutalist offset shadows and borders
- Typography: Poppins (4 weights), display scaling with `clamp()`
- Brutalist offset shadow pattern: `4px 4px 0 #111111` on hover
- Spacing follows 4pt scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

See `.impeccable.md` for full design context.
