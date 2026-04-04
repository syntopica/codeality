# Accessibility Standard

## Why lint-time accessibility matters

Accessibility issues caught at lint time cost nothing to fix. The same issue
caught in QA means a full UI review cycle; caught post-launch it means a legal
and reputational risk. `eslint-plugin-jsx-a11y` encodes the WCAG 2.1 AA standard
as ESLint rules that run on every save.

## Activation

Add `createAccessibilityConfig()` after the framework layer:

```ts
import { createAccessibilityConfig } from '@vibracomet/eslint-config/accessibility'
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createNextjsConfig } from '@vibracomet/eslint-config/nextjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(), // ← last
]
```

Add the devDependency:

```json
{ "eslint-plugin-jsx-a11y": "^6.10.0" }
```

All three React/JSX templates (`nextjs-app`, `vite-react-app`, `astro-site`)
include this by default.

## Key rules enforced

### Images must have meaningful alt text

```tsx
// ✗ — screen reader reads the filename
<img src="/avatar.png" />

// ✗ — "image" is not meaningful
<img src="/avatar.png" alt="image" />

// ✓
<img src="/avatar.png" alt="Profile photo of María García" />

// ✓ — decorative images use empty string to suppress
<img src="/divider.svg" alt="" role="presentation" />
```

### Interactive elements must be keyboard-accessible

```tsx
// ✗ — not focusable, no keyboard event, no role
<div onClick={handleClick}>Click me</div>

// ✓ — native button is keyboard-accessible by default
<button onClick={handleClick}>Click me</button>

// ✓ — if div is truly needed
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

### Form inputs must have labels

```tsx
// ✗ — input has no accessible name
<input type="email" placeholder="Enter email" />

// ✓ — explicit label association
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// ✓ — aria-label for compact UI
<input type="search" aria-label="Search products" />

// ✓ — aria-labelledby for complex layouts
<span id="qty-label">Quantity</span>
<input type="number" aria-labelledby="qty-label" />
```

### Anchors must have descriptive text

```tsx
// ✗ — "click here" is meaningless out of context
<a href="/docs">Click here</a>

// ✗ — empty anchor
<a href="/home"><Icon /></a>

// ✓
<a href="/docs">Read the documentation</a>

// ✓ — icon-only link needs aria-label
<a href="/home" aria-label="Go to homepage"><HomeIcon /></a>
```

### ARIA roles and attributes must be valid

```tsx
// ✗ — invalid role
<div role="button-group">...</div>

// ✗ — aria-checked only valid on checkable roles
<div role="button" aria-checked={true}>...</div>

// ✓
<div role="group" aria-label="Sorting options">...</div>
```

### Media must have alternatives

```tsx
// ✗ — no captions
<video src="/demo.mp4" autoPlay />

// ✓
<video src="/demo.mp4">
  <track kind="captions" src="/demo.vtt" srcLang="en" label="English" />
</video>
```

## Heading hierarchy

The linter does not enforce heading order (that is a structural concern), but
these rules do catch:

- Empty headings (`<h2></h2>`)
- Headings used for styling rather than structure (use CSS classes instead)

## Scope and limitations

`jsx-a11y` catches structural issues in JSX at author time. It cannot catch:

- Dynamic accessibility problems (e.g. a modal that traps focus after a state
  change)
- Color contrast violations (use a design system token system or Lighthouse)
- Screen reader announcement ordering

For runtime validation, supplement with Axe DevTools or run Lighthouse CI on
every deployment.

## Tuning

To disable a rule for a specific element where the pattern is intentional:

```tsx
{
  /* eslint-disable-next-line jsx-a11y/no-autofocus -- search modal, intentional UX decision */
}
;<input autoFocus />
```

Never disable the entire plugin — structural accessibility is non-negotiable.
