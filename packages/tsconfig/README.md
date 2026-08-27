# @busirocket/tsconfig

Shared TypeScript `extends` presets for apps and libraries (Next.js, Astro,
Vite + React, Node).

## Requirements

- Node.js 20+
- TypeScript 5.4+ (align with your project)

## Install

```bash
pnpm add -D @busirocket/tsconfig@^0.1.0 typescript
```

## Exports

| Subpath             | Use case           |
| ------------------- | ------------------ |
| `./base.json`       | Strict baseline    |
| `./app.json`        | Browser / app TS   |
| `./nextjs.json`     | Next.js App Router |
| `./astro.json`      | Astro              |
| `./vite-react.json` | Vite + React       |
| `./node.json`       | Node libraries     |

## The two root shapes

There are exactly two correct shapes, and they are opposites. Getting this wrong
is not a style problem: `baseline-type-coverage` (`@busirocket/quality-config`
0.10.0+) walks a solution root's `references` to find the projects it measures,
so a root that extends a preset instead of referencing hands the runner one
project and hides the rest. That exact shape once made the runner answer
`type-coverage: ok . 0 / 0` over an entire repository, and
`create-baseline --check` now reports both mistakes (`tsconfig-project:*` and
`tsconfig-preset:*` findings).

**Single project** - one tsconfig, and it extends the preset directly:

```json
{
  "extends": "@busirocket/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

**Multiple projects** - the root stays solution-style and the presets go on the
leaves. The root itself must NOT extend a preset:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Every leaf (`tsconfig.app.json`, `tsconfig.node.json`, ...) extends the preset
that matches its runtime, exactly like the single-project example. A
hand-written leaf silently drops the baseline's strictness - no
`noUncheckedIndexedAccess`, no `exactOptionalPropertyTypes` - while the
repository still carries the dependency and looks adopted.

`type-check` must reach every referenced project: either a bare `tsc -b` at the
root, or one `tsc -p <project> --noEmit` per reference. A script that names only
some of the references leaves the rest out of CI entirely, and nothing else will
tell you.

## Next.js notes

**Never include `.next/dev/types` in a project the gate compiles.** The example
above names `.next/types/**/*.ts`, written by `next build`, and that is the only
`.next` path that belongs in `include`. Next 16 also writes `.next/dev/types`
during `next dev`, and a stale or half-written `validator.ts` there fails to
parse (`TS1434: Unexpected keyword or identifier`). Because the failure lands on
a gitignored dev artifact rather than any source file, it looks unfixable, and
the reasonable-looking response is to drop the whole Next project from
`type-check` - which is how a repository loses its largest project from the
gate.

**Next does not rewrite a tsconfig this preset has completed.** The comment
consumers put above their Next tsconfig in `.prettierignore` - "Next rewrites
this file on every build" - is wrong once the preset is in place:
`writeConfigurationDefaults` only writes options missing from the resolved
config, and the preset supplies them all. Verified through the real path:
`next build` exits 0, `next dev` boots, and both leave the file byte-identical.
A repository on the preset can take that file out of `.prettierignore` and have
it formatted like everything else.

## Repository

Source and issues:
[github.com/BusiRocket/tsconfig](https://github.com/BusiRocket/tsconfig).

Broader adoption docs:
[engineering-baseline](https://github.com/BusiRocket/engineering-baseline).
