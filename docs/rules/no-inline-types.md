# code-policy/no-inline-types

> Enforce that type aliases and interfaces live in their own dedicated files.

Type declarations that appear alongside implementation code create hidden coupling and violate the single responsibility principle. Every `type` or `interface` must be in a dedicated file, ideally inside a `types/` directory.

**Category:** Architectural  
**Recommended:** Yes  
**Fixable:** No

## Rule Details

The rule scans every top-level declaration in a file. If the file contains more than one unit (function, class, type, variable, enum), it reports any declarations after the first. This catches type aliases cohabiting with implementation code.

### Incorrect

```ts
// src/canEdit.ts -- mixed type + implementation
type UserRole = 'admin' | 'member' | 'guest'

export function canEdit(role: UserRole) {
  return role === 'admin'
}
```

### Correct

```ts
// src/types/UserRole.ts
export type UserRole = 'admin' | 'member' | 'guest'
```

```ts
// src/canEdit.ts
import type { UserRole } from '@/types/UserRole'

export function canEdit(role: UserRole) {
  return role === 'admin'
}
```

## Exemptions

The rule is **automatically skipped** for:

| Pattern                                         | Reason                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files inside `types/` or `types/**` directories | These are the intended home for type declarations                                                                                                                     |
| `*.d.ts` files                                  | Ambient declaration files are type-only by nature                                                                                                                     |
| Pure type files                                 | Files whose entire body consists only of `import` + `type`/`interface` declarations                                                                                   |
| Next.js `route.ts` files                        | HTTP method exports (`GET`, `POST`, etc.) are not counted                                                                                                             |
| Next.js reserved exports                        | `config`, `metadata`, `dynamic`, `revalidate`, `fetchCache`, `runtime`, `preferredRegion`, `viewport`, `generateMetadata`, `generateViewport`, `generateStaticParams` |

## Options

This rule has no options.

## When Not To Use It

If you prefer co-locating small component prop types with their component (e.g., `ButtonProps` inside `Button.tsx`), disable this rule for those specific files.
