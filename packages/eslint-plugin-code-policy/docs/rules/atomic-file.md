# code-policy/atomic-file

> Enforce exactly one top-level declaration per file.

Each file must export exactly one top-level unit -- a function, class, constant,
or type. This is the foundation of hyper-modular architecture: if a file has two
things, one of them belongs in a new file.

**Category:** Architectural  
**Recommended:** Yes  
**Fixable:** No

## Rule Details

The rule counts top-level declarations in a file's AST. Imports, `export *`
re-exports, and bare `export { ... }` statements are not counted. When the count
exceeds 1, the rule reports every declaration after the first.

### Incorrect

```ts
// src/UserUtils.ts -- two exports in one file
export function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`
}

export function getUserAge(user: User) {
  return new Date().getFullYear() - user.birthYear
}
```

### Correct

```ts
// src/formatUserName.ts
export function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`
}
```

```ts
// src/getUserAge.ts
export function getUserAge(user: User) {
  return new Date().getFullYear() - user.birthYear
}
```

## Exemptions

The rule is **automatically skipped** for:

| Pattern                                                                                                                               | Reason                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*.config.ts`, `*.config.js`, `*.config.mjs`, `*.config.cjs`                                                                          | Config files often export multiple settings                                                                                                                                                                                                                          |
| `index.ts`, `index.tsx`, `index.js`                                                                                                   | Barrel re-export files by design aggregate exports                                                                                                                                                                                                                   |
| `*.d.ts`                                                                                                                              | Ambient declaration files declare multiple types                                                                                                                                                                                                                     |
| Next.js router files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, `middleware.ts`, `proxy.ts`) | Reserved exports (`metadata`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `config`, `dynamic`, `revalidate`, `fetchCache`, `runtime`, `preferredRegion`, `viewport`, `generateMetadata`, `generateViewport`, `generateStaticParams`) are not counted |

An `export default` that simply references an identifier (e.g.,
`export default Component`) or wraps one in a single-argument call (e.g.,
`export default memo(Component)`) is not counted as an additional declaration.

## Options

This rule has no options.

## When Not To Use It

If you intentionally keep multiple related small utilities in a single file
(e.g., during rapid prototyping) and plan to split later, you can disable this
rule per file with `// eslint-disable-next-line code-policy/atomic-file`.
