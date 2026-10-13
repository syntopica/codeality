# code-policy/no-inline-types-in-runtime-files

> **Enforce that type aliases and interfaces live in their own files.**

Type declarations that appear alongside implementation code create hidden
coupling and violate the single responsibility principle. Every `type` or
`interface` must be in a dedicated file, isolating runtime from type
declarations.

An anonymous object type written into runtime code is the same unit without a
name, so it is reported too: `const rows: { a: string }[]`,
`JSON.parse(text) as { version: string }`, a parameter or return annotation, or
a type argument such as `new Map<string, { count: number }>()`. Only the
outermost literal is reported. A literal inside a named type is that type's
body, and one inside `declare global` or `declare module` has no file to move
to.

**Exemptions**

- Files inside `types/` or `types/**` directories
- `*.d.ts` files
- "Pure type files" — files whose entire body consists only of `import` +
  `type`/`interface` declarations

**Recommended:** Yes (`error`)  
**Fixable:** No
