# UX Writing Reference

Deeper material on labels, error messages, and empty states. Used by the impeccable skill.

---

## Principles

**Every word earns its place.** If removing a word doesn't change the meaning or usability, remove it.

The three questions for every UI string:

1. Is it necessary? (Would the user be worse off without it?)
2. Is it clear? (Does it mean exactly one thing to the reader?)
3. Is it kind? (Does it treat the user as a capable adult?)

---

## Labels

### Button Labels

Buttons should describe their action, not just confirm. The pattern is: **verb + object**.

```
✗ "Submit"          → ✓ "Publicar perfil"
✗ "OK"              → ✓ "Entendido" / "Aceptar cambios"
✗ "Continue"        → ✓ "Siguiente: Detalles de pago"
✗ "Delete"          → ✓ "Eliminar reserva"
✗ "Process"         → ✓ "Iniciar pago"
✗ "Cancel"          → ✓ "Cancelar" (only acceptable as secondary action to a specific action)
```

For destructive actions, be explicit about what's being destroyed:

```
✗ "Are you sure?"   → ✓ "¿Eliminar esta reserva del 15 de enero?"
✗ "Confirm delete"  → ✓ "Sí, eliminar reserva"
```

### Form Labels

Short and specific. Don't restate what the placeholder already says.

```
✗ "Enter your full name"    → ✓ "Nombre completo"
✗ "Please enter your email" → ✓ "Correo electrónico"
✗ "Password (required)"    → ✓ "Contraseña" + error state if not filled
```

Required vs optional: Mark optional fields, not required ones. Required is the default expectation.

```html
<label>Sitio web <span class="text-muted">(opcional)</span></label>
```

### Navigation Labels

One word where possible. Be consistent: if you use "Eventos" in the nav, use "Eventos" everywhere — not "Calendario" on one page.

---

## Error Messages

The error message formula: **What happened** + **why** + **what to do**.

Not all three are always needed — sometimes "what to do" is obvious. But "what happened" without guidance is useless.

```
✗ "Error 422"
✗ "Invalid input"
✓ "El correo ya está registrado. ¿Quieres iniciar sesión con él?"

✗ "Network error"
✓ "No pudimos guardar tus cambios. Revisa tu conexión e intenta de nuevo."

✗ "Invalid date"
✓ "La fecha debe ser posterior a hoy."

✗ "File too large"
✓ "La imagen supera los 5 MB. Reduce el tamaño o elige otra."
```

### Error Placement

- **Field errors**: below the field, visible without scrolling, linked via `aria-describedby`
- **Form-level errors**: above the submit button or at the top of the form, after submission
- **System errors**: toasts for non-blocking issues; full error states for blocking failures
- **Auth errors**: never reveal which part is wrong ("user not found" vs "wrong password") — just "Credenciales incorrectas"

### Tone for Errors

- Don't blame the user: ✗ "You entered an invalid email" → ✓ "This email doesn't look right"
- Don't use technical language: ✗ "500 Internal Server Error" → ✓ "Algo salió mal de nuestro lado. Intenta de nuevo en un momento."
- Don't be apologetic for the user's error: ✗ "Sorry, we couldn't find that" → ✓ "No encontramos ese artista. Prueba con otro nombre."

---

## Empty States

Empty states are not failures — they're opportunities to teach the interface and motivate the user.

Structure: **what's empty** + **why it's empty (briefly)** + **what to do next (action)**

```
✗ "No results"
✗ "Nothing here yet"
✓ "Aún no tienes reservas"
   "Explora los mentores disponibles y agenda tu primera sesión."
   [Explorar mentores →]

✗ "No events found"
✓ "Próximamente más eventos"
   "Suscríbete para ser el primero en enterarte cuando publiquemos nuevas fechas."
   [Suscribirme]

✗ "Empty"
✓ "Tu tablero está listo"
   "Empieza guardando oportunidades que te interesen."
   [Explorar oportunidades →]
```

The action should be the most logical next step, not a generic "Go home" button.

---

## Microcopy

Microcopy is the tiny text that surrounds interactive elements. It does a lot of work.

### Helper Text (below fields)

```
Nombre de usuario: "Solo letras, números y guiones bajos. Visible para otros."
Contraseña: "Mínimo 8 caracteres. Usa letras y números."
Correo: "Para tu cuenta y notificaciones. No lo compartimos."
```

### Confirmation Messages

```
✗ "Success!"
✓ "Reserva confirmada para el martes 20 a las 3 pm."
   "Revisa tu correo — te enviamos los detalles."

✗ "Updated."
✓ "Perfil actualizado. Los cambios ya son visibles."
```

### Status and Progress

```
3 pasos / paso 1 de 3        ← for multi-step flows
Guardando...                  ← loading state
Guardado                      ← success state
No guardado (revisa tu conexión) ← failure state
```

---

## Tone and Voice

For Opera Prima (Colombian creative platform for emerging artists):

- Warm, not formal
- Direct, not bureaucratic
- Culturally specific where appropriate ("Artistas colombianos", "comunidad creativa")
- Never condescending; treat the user as a peer
- Energy of a supportive colleague, not a corporate chatbot

Examples of tone differences:

| Formal/Generic                                | Opera Prima Voice                                                   |
| --------------------------------------------- | ------------------------------------------------------------------- |
| "Please complete all required fields."        | "Faltan algunos datos — revísalos antes de continuar."              |
| "Your account has been created successfully." | "¡Ya eres parte de Opera Prima! Completa tu perfil para empezar."   |
| "Your session has expired."                   | "Tu sesión se cerró por inactividad. Vuelve a iniciar sesión."      |
| "Error: user not found."                      | "No encontramos ese correo. ¿Aún no tienes cuenta?"                 |
| "No events available."                        | "Próximamente nuevos eventos. Suscríbete para no perderte ninguno." |

---

## Internationalization Notes (Spanish Colombia)

- Use `tú` not `usted` (informal, peer tone)
- `Correo electrónico` not `email` in labels (though `email` in microcopy is acceptable)
- Date format: `20 de enero de 2025` not `01/20/2025`
- Currency: `$150.000 COP` or `$150k` colloquially (Colombian peso uses periods for thousands)
- Avoid Anglicisms unless they're ubiquitous in the creative community: "perfil", "portfolio" (both accepted)

---

## Anti-patterns

- **Placeholder-only labels** — disappear on focus, fail WCAG 1.3.5
- **Restating the heading** — "Welcome to the dashboard. This is your dashboard." Remove the second sentence.
- **All-caps for body text** — reserve for short labels (2–4 words) only
- **Passive voice for errors** — "An error was encountered" → "No pudimos conectar"
- **Ambiguous CTAs in dialogs** — "Cancel / OK" where both buttons say "OK" to different things; use explicit verb labels
- **Technical strings surfaced to users** — "ERR_NETWORK_CHANGED", "401 Unauthorized", "null" in the UI
