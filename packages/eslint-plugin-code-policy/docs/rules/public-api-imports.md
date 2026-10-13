# code-policy/public-api-imports

> Prevent importing directly from internal module subpaths.

When consuming a package or module, you must import from its public API (the
root / index), not from a deep internal path. Deep imports couple you to
internal implementation details that can change without notice.

**Category:** Import Boundaries  
**Recommended:** Yes  
**Fixable:** No

## Rule Details

The rule checks every static module edge: `import`, `export ... from`,
`export * from` and `import('literal')`. If the path is **non-relative**
(absolute or aliased), contains one of the `bannedSubpaths` segments and none of
the `allowedSubpaths` segments, the rule reports it. It compares strings: it
does not resolve the import or read the target package's `exports`, and a
computed `import(path)` cannot be checked.

Relative imports (`./`, `../`) are ignored -- those are governed by the
`no-cross-module-deep-imports` rule instead.

### Incorrect

```ts
// Bypassing the public API
import { Button } from '@myorg/ui/src/components/Button'
import { formatDate } from '@myorg/utils/src/date/formatDate'
```

### Correct

```ts
// Always import through the public surface
import { Button } from '@myorg/ui'
import { formatDate } from '@myorg/utils'
```

## Options

```js
{
  'code-policy/public-api-imports': ['error', {
    bannedSubpaths: ['/src/'], // default
    allowedSubpaths: ['/src/public/'] // default: []
  }]
}
```

| Option            | Type       | Default     | Description                                                                                                                      |
| ----------------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `bannedSubpaths`  | `string[]` | `['/src/']` | Path segments that signal a deep internal import. If any segment appears in the import path, the import is flagged.              |
| `allowedSubpaths` | `string[]` | `[]`        | Path segments a package deliberately exposes. A path containing one is never flagged, even if it also contains a banned segment. |

## When Not To Use It

If your project explicitly exposes deep subpath exports via `package.json`
`exports` field (e.g., `@myorg/ui/Button`), you may want to customize
`bannedSubpaths` to only flag truly internal paths like `/src/` or `/internal/`.
