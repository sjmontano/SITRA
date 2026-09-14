# Interaction Design Reference

Deeper material on forms, focus management, and loading patterns. Used by the impeccable skill.

---

## Form Design

Forms are the highest-friction interfaces. Every unnecessary field, every unclear label, every broken error message costs real conversions.

### Field Labels

Always use visible labels above fields. Never rely on placeholder text as a label — it disappears on focus, fails WCAG 2.2 (1.3.5), and confuses users with cognitive disabilities.

```html
<!-- ✓ Correct: label above field -->
<label for="email">Correo electrónico</label>
<input id="email" type="email" placeholder="tu@ejemplo.com" />

<!-- ✗ Wrong: placeholder as label -->
<input type="email" placeholder="Correo electrónico" />
```

Placeholder text is for _hints_ about format, never for labels.

### Field Order

Lead with the easiest fields. Ask for name and email before phone. Ask for email before password. Ask for optional fields last (and mark them optional, not required).

### Inline Validation Timing

| Scenario                          | When to validate                  |
| --------------------------------- | --------------------------------- |
| Required field not filled         | On blur (not on keystroke)        |
| Format validation (email, phone)  | On blur                           |
| Real-time availability (username) | On keystroke with 500ms debounce  |
| Password strength                 | On first keystroke after 3+ chars |
| Form submission errors            | Immediately on submit             |

Never show "required" errors on fields the user hasn't touched.

### Error Messages

Follow the pattern: **What happened + what to do**. Never just state the condition.

```
✗ "Invalid email"
✓ "This email address isn't valid. Check for typos like missing @ or .com."

✗ "Password too short"
✓ "Use at least 8 characters. Mix letters and numbers for a strong password."

✗ "Username taken"
✓ "That username is already in use. Try adding numbers or your initial."
```

Error placement: below the field, in red, with an icon. Never above. Never in a toast.

### Password Fields

Always include a show/hide toggle. Many users have motor difficulties or are on mobile. Forcing users to type passwords blindly causes more errors than it prevents.

```tsx
const [showPassword, setShowPassword] = useState(false)

;<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    className="pr-10"
    aria-describedby="password-hint"
  />
  <button
    type="button"
    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    onClick={() => setShowPassword(!showPassword)}
    className="absolute top-1/2 right-3 -translate-y-1/2"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

---

## Focus Management

Focus order must match visual order. Tab through every interactive element in a form or page — if the focus order jumps around visually, fix the DOM order rather than using `tabindex`.

### Custom Focus Styles

Never `outline: none` without providing an alternative. The browser's default focus ring is often invisible (especially in Chrome). Provide a visible custom focus ring:

```css
:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

/* For dark backgrounds */
.dark :focus-visible {
  outline-color: var(--brand-light);
}
```

Use `:focus-visible` not `:focus` — it only shows for keyboard navigation, not mouse clicks.

### Focus Trapping in Modals

When a modal opens, focus must be trapped inside. When it closes, focus must return to the trigger.

```tsx
import { useEffect, useRef } from 'react'

function Modal({ isOpen, onClose, triggerRef, children }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    const trap = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    modal.addEventListener('keydown', trap)
    return () => {
      modal.removeEventListener('keydown', trap)
      triggerRef.current?.focus() // return focus on close
    }
  }, [isOpen])
}
```

In practice, use [Radix UI](https://www.radix-ui.com/) or shadcn/ui — they implement this correctly.

---

## Loading States

### Optimistic UI

Update the UI immediately and sync in the background. Only show loading indicators when the delay is unavoidable and the user must wait.

```ts
// ✓ Optimistic: immediate feedback
const [likes, setLikes] = useState(initialLikes)

async function handleLike() {
  setLikes((prev) => prev + 1) // immediately
  try {
    await updateLike(postId)
  } catch {
    setLikes((prev) => prev - 1) // revert on failure
    showToast('No se pudo actualizar. Intenta de nuevo.')
  }
}
```

### Skeleton Screens vs Spinners

| Situation                                | Prefer                        |
| ---------------------------------------- | ----------------------------- |
| Known layout (list of cards, table rows) | Skeleton screens              |
| Unknown layout                           | Spinner                       |
| Fast operation (<300ms)                  | Nothing — suppress the loader |
| User-initiated action                    | Button loading state          |
| Background sync                          | Nothing visible               |

```tsx
// Suppress loaders for fast operations
function useDelayedLoading(isLoading: boolean, delay = 300) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }
    const timer = setTimeout(() => setShowLoading(true), delay)
    return () => clearTimeout(timer)
  }, [isLoading, delay])

  return showLoading
}
```

### Button Loading State

```tsx
<button disabled={isPending} aria-busy={isPending} className="relative">
  <span className={isPending ? 'opacity-0' : 'opacity-100'}>Guardar cambios</span>
  {isPending && (
    <span className="absolute inset-0 flex items-center justify-center">
      <Spinner aria-hidden="true" />
    </span>
  )}
</button>
```

---

## Progressive Disclosure

Start simple, reveal sophistication through interaction.

1. **Basic options first** — Show the 80% use case. Hide advanced behind expandable sections.
2. **Secondary actions on hover** — Delete, share, report actions appear on hover, not by default.
3. **Empty states that teach** — "No has creado ningún perfil todavía. [+ Crear primer perfil]" — not just "No hay perfiles".

```tsx
// Empty state that teaches
function EmptyState({ type }) {
  const config = {
    mentors: {
      icon: <Users />,
      title: 'Aún no hay mentores',
      description: 'Los mentores aparecerán aquí cuando se publiquen.',
      action: null, // non-admin can't create
    },
    bookings: {
      icon: <Calendar />,
      title: 'No tienes reservas todavía',
      description: 'Explora los mentores disponibles y agenda tu primera sesión.',
      action: <Link href="/mentores">Ver mentores →</Link>,
    },
  }
  // ...
}
```

---

## Anti-patterns

- **Floating labels** — `position: absolute` labels that move on focus look clever but confuse VoiceOver and Dragon NaturallySpeaking
- **Multi-step forms with no progress indicator** — users can't gauge effort; show step X of Y
- **Inline form submission** — always provide explicit submit buttons, never submit-on-blur
- **Generic error messages** — "Something went wrong" is not an error message; it's a sign of lazy engineering
- **Confirmation dialogs for reversible actions** — "Are you sure?" for actions that can be undone adds friction without benefit; let users undo instead
- **Toast errors for form validation** — validation errors belong next to the field, not in a toast that disappears
