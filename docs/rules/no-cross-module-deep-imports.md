# code-policy/no-cross-module-deep-imports

> Prevent relative imports that bypass another module's public API within a monorepo.

In a monorepo, relative paths like `../../core/src/utils/helper` skip the `core` module's public API entirely. This rule detects that pattern by counting `../` traversal depth and checking for internal directory names in the descent.

**Category:** Import Boundaries  
**Recommended:** Yes  
**Fixable:** No

## Rule Details

The rule only examines **relative** imports (starting with `./` or `../`). It activates when:

1. The import path contains at least `minParentTraversals` levels of `../` (default: 2).
2. After the `../` traversal, the path descends into a directory matching one of `internalDirs` (default: `['src']`).

Non-relative imports (absolute, aliased) are ignored -- those are handled by the `public-api-imports` rule.

### Incorrect

```ts
// packages/ui/src/Button.tsx
import { helper } from '../../core/src/utils/helper'
//                      ^^^^^^ 2x ../ then descends into src/
```

### Correct

```ts
// packages/ui/src/Button.tsx
import { helper } from '@myorg/core' // through published public API
```

## Options

```js
{
  'code-policy/no-cross-module-deep-imports': ['error', {
    minParentTraversals: 2, // default
    internalDirs: ['src']   // default
  }]
}
```

| Option                | Type       | Default   | Description                                                                                                    |
| --------------------- | ---------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `minParentTraversals` | `number`   | `2`       | Minimum `../` segments before the rule activates                                                               |
| `internalDirs`        | `string[]` | `['src']` | Directory names that signal internal code. If the import descends into one after traversing up, it is flagged. |

## When Not To Use It

If your project is not a monorepo, or if you use a flat directory structure without clearly separated modules, this rule may produce false positives. In that case, disable it globally.
