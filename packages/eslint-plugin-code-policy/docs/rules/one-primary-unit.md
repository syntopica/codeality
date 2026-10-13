# code-policy/one-primary-unit

> **Forbid more than one top-level exported unit per file.**

A file that exports two or more top-level units (functions, classes, constants
or types) is reported. A file with no export is not reported by this rule, and a
class counts as one unit however many methods it has; pair it with
`no-hidden-top-level-declarations` and a size cap such as `max-lines` to bound
what a single unit can hold.

**Exemptions (automatically skipped)**

- `*.config.ts` / `*.config.js` / `*.config.mjs`
- `index.ts` / `index.tsx` / `index.js` (barrel files)
- Next.js special files: `page.tsx`, `layout.tsx`, `route.ts`, etc. — reserved
  exports like `GET`, `POST`, `metadata` are not counted.

**Recommended:** Yes (`error`)  
**Fixable:** No
