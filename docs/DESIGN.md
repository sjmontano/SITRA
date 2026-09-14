---
name: sitra-design
description: Design tokens and rationale for SITRA — Sistema de Trazabilidad de Recursos. Adaptado del diseño operativo de Opera Prima, refactorizado para una app web de una sola vista con video-background, tipografía retro dot-matrix y tema híbrido conmutable.
version: alpha
user-invocable: true
argument-hint: '[create|lint|export]'
source: internal
license: MIT
---

# DESIGN.md — SITRA (Sistema de Trazabilidad de Recursos)

## Diseño adaptado desde Opera Prima

Este documento adapta los tokens y decisiones de diseño de **Opera Prima** a SITRA, considerando:

- **Contexto**: landing page de video-background, single-viewport, plataforma de trazabilidad de recursos públicos con blockchain.
- **Restricción**: HTML + CSS + vanilla JS (sin framework), archivo `index.html` + `styles.css` + `main.js` exactos.
- **Adaptación**: colores institucionales, tipografía (Inter + BubbledotICG-FinePos + Geist Pixel Circle + Font Awesome), disposición de header/heró/stats, y comportamiento móvil.

---

## 1. Colores institucionales (adaptados desde Opera Prima)

| Token | Valor | Comentario |
|-------|-------|------------|
| `--bg` | `#000000` | Fondo negro, igual que el video y la body |
| `--text` | `#ffffff` | Texto principal |
| `--muted` | `#8e8e8e` | Texto secundario/legendario |
| `--nav-text` | `#2e2e2e` | Texto de nav desktop |
| `--pill-dark` | `#28282a` | Píldoras y overlay |
| `--sign-in-text` | `#c8c8c8` | Texto Sign in |
| `--nav-shadow` | `0 4px 14px rgba(0,0,0,0.16)` | Sombra suave nav/logo |
| `--trust-bg` | `#28282a` | Fondos de anillos de confianza |
| `--trust-border` | `rgba(255,255,255,0.4)` | Bordes de anillos |
| `--trust-text` | `#c4c2c3` | Texto en confianza |
| `--font-sans` | `"Inter", "Segoe UI", system-ui, sans-serif` | Igual que el plan |
| `--font-display` | `"BubbledotICG-FinePos", "Geist Pixel Circle", monospace` | Igual que el plan |

---

## 2. Tipografía (adaptada)

### Familia visual (orden de carga)

1. **Inter** (UI) — Google Fonts, pesos 400/500/600.
2. **BubbledotICG-FinePos** (primario display) — OnlineWebFonts CDN, retro dot-matrix. **No usar archivos locales**.
3. **Geist Pixel Circle** (fallback display) local `@font-face`, weight 400.
4. **Font Awesome 6.5.2** (iconos enterprise) — cdnjs.

### Stacks aplicadas

- UI: `"Inter", "Segoe UI", system-ui, sans-serif`
- Display: `"BubbledotICG-FinePos", "Geist Pixel Circle", monospace`

### Tamaños y pesos (idénticos al plan)

- Headline: `clamp(28px, 6.2vw, 80px)`, letter-spacing `-0.04em`/`-0.08em`/`-0.09em`, line-height 1.12.
- Subhead: `clamp(calc(13.5px + 2pt), calc(1.55vw + 2pt), calc(16.5px + 2pt))`, opacity 0.8.
- Stats value: `clamp(18px, 2.2vw, 26px)`, letter-spacing `-0.025em`, tabular-nums.
- Label: `clamp(11px, 1.2vw, 12.5px)`.
- Nav link: `clamp(13px, 1.4vw, 15px)`, letter-spacing `-0.01em`.

---

## 3. Espaciado y layout (adaptado al landing)

### `.page` (identico al plan)

- flex column, centered, padding `clamp(16px, 2.4vh, 28px) clamp(14px, 3vw, 32px)`, height `100vh`/`100dvh`, overflow hidden.

### Header / Hero / Stats (idéntico al plan)

- Las mismas medidas exactas: `clamp()`, breakpoints ≤720px/≤420px, stagger delays, counts.

---

## 4. Tokens derivados (solo design)

No hay grid ni componentes React — el landing usa HTML/CSS/JS puros. Los tokens arriba definen los valores que `main.js` y `styles.css` consumen directamente. No hay `design-tokens.ts` ni `@theme` export.

---

## 5. Decisiones de diseño vs Opera Prima

| Decisión Opera Prima | Decisión SITRA | Razón |
|---|---|---|
| `fontFamily: Poppins` | `fontFamily: "Inter", "Segoe UI", system-ui, sans-serif` | SITRA usa Inter, no Poppins (plan exacto). |
| `bg: #FFFFFF` (fondo blanco) | `bg: #000000` (negro) | El plan exige video-background negro. |
| `grid` de 12 columnas | Sin grid, single-viewport vertical | El plan es landing 1-vp; 4 métricas en grid 2×2 móvil. |
| Colores neón / gradientes | Paleta monocromo + confín `#28282a` | El plan exige video negro + textos/métricas blancas/gris. |
| `fontFamily: Poppins` para display | `fontFamily: "BubbledotICG-FinePos"` | El plan exige fuente retro dot-matrix exacta. |

---

## 5. Archivos para este diseño

- `docs/DESIGN.md` — este documento.
- `index.html` — estructura HTML exacta (vía plan).
- `styles.css` — todas las variables CSS + layout + animaciones.
- `main.js` — conteo de stats, animaciones, toggle móvil.
- `assets/logo.webp` — logo circular.
- `fonts/GeistPixel-Circle.woff2` — fallback display.
- Enlaces CDN: Inter, BubbledotICG-FinePos, Font Awesome 6.5.2.
- Video: `https://d8j0ntlcm91z4.cloudfront.net/...` (CloudFront URL exacta).