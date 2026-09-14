# Craft Flow

The craft flow guides building a new feature or component: first shape the design direction, then build.

Invoked with: `/impeccable craft [feature description]`

---

## Phase 1: Shape

Before writing a single line of code, define the design direction. This prevents the most common failure mode: building something technically correct but aesthetically generic.

### Step 1.1 — Load Design Context

1. Read `.impeccable.md` from the project root (required)
2. If not found, run `/impeccable teach` first
3. Note the brand personality, palette, anti-references, and design principles

### Step 1.2 — Articulate the Design Problem

Write (internally) a one-paragraph brief:

- What does this feature do?
- Who uses it, in what context?
- What emotion should it evoke?
- What's the single most important interaction?

### Step 1.3 — Run the AI Slop Test (Pre-Build)

Before designing, explicitly reject these for the current feature:

- [ ] Rounded card with icon + heading + body text + CTA button (the "template card")
- [ ] Centered layout with everything stacked vertically
- [ ] Hero section with gradient background and a single big headline
- [ ] Three-column grid of identical cards with drop shadows
- [ ] Modal with just a form inside
- [ ] Progress indicator using dots or a simple bar

If any of these would "work fine," look for what would work _better_.

### Step 1.4 — Define the Direction

Commit to answers to these questions:

1. **Aesthetic tone**: Pick one extreme (not "clean and modern"). Examples: brutalist raw / editorial refined / warm organic / systematic dense / playful tactile
2. **Layout approach**: Grid? Asymmetric? Full-bleed? Horizontal scroll? Overlap?
3. **Typography character**: How does type create hierarchy here? What's the dominant scale step?
4. **Color story**: Which tokens does this feature use? What's the accent, the surface, the text?
5. **Motion story**: What transitions, if any, does this feature use? Where?
6. **What will make it memorable?** Name one specific detail.

### Step 1.5 — Verify Against Design System

Cross-check the direction against the project's DESIGN.md and `.impeccable.md`:

- All colors from the token set?
- All fonts from the defined stack?
- Spacing from the 4pt scale?
- No border-left/right accents (absolute ban)?
- No gradient text (absolute ban)?

---

## Phase 2: Build

With the direction confirmed, implement the feature.

### Implementation Checklist

**Structure**

- [ ] Server Component by default; `"use client"` only for interactivity
- [ ] Early returns for conditional rendering — max 2 levels of nesting
- [ ] Component < 100 lines; split if larger

**Typography**

- [ ] Fluid sizing with `clamp()` on display/heading text
- [ ] Correct line-heights (tight for headings, loose for body)
- [ ] No more than 2 font families in scope

**Color**

- [ ] All colors from OKLCH tokens
- [ ] WCAG AA contrast on all text
- [ ] Tinted neutrals, not pure grays

**Spacing**

- [ ] All spacing from 4pt scale
- [ ] `gap` for sibling spacing (not margins)
- [ ] Varied spacing for hierarchy

**Motion**

- [ ] Transform + opacity only
- [ ] `prefers-reduced-motion` respected
- [ ] No bounce/elastic easing

**Accessibility**

- [ ] Focusable elements reachable by keyboard
- [ ] `:focus-visible` styles present
- [ ] `aria-label` on icon-only buttons
- [ ] Error messages linked via `aria-describedby`
- [ ] Touch targets ≥ 44px

**Form fields (if present)**

- [ ] Visible labels (never placeholder-only)
- [ ] Validation on blur, not on keystroke (except availability checks)
- [ ] Error messages follow "what happened + what to do" formula
- [ ] Password fields have show/hide toggle

### After Building

Run the AI Slop Test (Post-Build):

1. Could this component appear unchanged in 10 other projects without looking out of place?
2. Does it use any pattern from the absolute_bans list?
3. Would a knowledgeable designer describe it as "generic but functional"?

If any answer is yes, identify the specific element that makes it generic and redesign that element.
