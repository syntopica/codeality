# Adopting the baseline in a new repository

## 1. Initialize the project

Create your app or library with your framework CLI (Next.js, Vite, Astro, and so
on). Enable TypeScript and ESM where the template allows.

## 2. Add baseline packages

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 @busirocket/prettier-config@^0.1.0 @busirocket/tsconfig@^0.1.0
```

Add framework peers as required by the ESLint layers you will import (see
`@busirocket/eslint-config` README).

### Allow the build scripts pnpm 11 blocks

pnpm 11 refuses to run a dependency's install scripts until you say which are
allowed, so a fresh repo fails with `ERR_PNPM_IGNORED_BUILDS` naming `lefthook`,
`unrs-resolver` and `sharp`. The `pnpm.onlyBuiltDependencies` field the error
suggests putting in `package.json` is **ignored by pnpm 11**. The working form
is `allowBuilds:` in `pnpm-workspace.yaml`, which is what this monorepo uses -
and the file is needed even in a single-package repo:

```yaml
# pnpm-workspace.yaml
allowBuilds:
  lefthook: true
  unrs-resolver: true
  # Only if you use it - sharp is next's image optimiser.
  sharp: true
```

Everything not listed stays blocked, which is the point: no dependency runs a
postinstall you did not decide about. CI needs this too - pnpm errors on
un-decided build scripts under `--frozen-lockfile`.

### Next.js 16.3+ with the TypeScript alias needs one config flag

This repo aliases `typescript` to `npm:@typescript/typescript6` (the TS7 native
compiler trial). Next 16.3 flipped type checking to the `tsc` CLI by default and
locates that CLI through the resolved `typescript` package's own `bin.tsc`
entry - which the alias does not declare; its only bin is `tsc6`. So
`next build` dies with "It looks like you're trying to use TypeScript but do not
have the required package(s) installed" even though
`require.resolve('typescript')` resolves fine, and it runs
`pnpm install --save-dev typescript` over your alias on the way out.

`templates/nextjs-app` used to pin `next`, `eslint-config-next` and
`@next/eslint-plugin-next` to an exact 16.2.x for this reason. It no longer
does. Setting `experimental.useTypeScriptCli: false` in `next.config.ts` sends
Next back to the compiler API entry (`lib/typescript.js`), which resolves
through the alias normally and type-checks exactly as 16.2.x did:

```typescript
const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,
  },
}
```

Measured on 16.3.2: the build fails without the flag and succeeds with it, and
moving off 16.2.12 removed two `pnpm audit` high findings that previously needed
`overrides` entries (`sharp` GHSA-f88m-g3jw-g9cj and PostCSS GHSA-6g55-p6wh-862q
/ GHSA-r28c-9q8g-f849).

Drop the flag once the alias ships a `tsc` bin, or once you move to a real
`typescript` package. If you are not using the alias at all, you never needed
it.

## 3. Wire Prettier

Create `prettier.config.mjs`:

```javascript
export { default } from '@busirocket/prettier-config'
```

For a frontend app with Tailwind, use `@busirocket/prettier-config/frontend`
instead.

## 4. Wire TypeScript

Set `extends` in `tsconfig.json` to the profile that matches your stack, for
example:

```json
{
  "extends": "@busirocket/tsconfig/nextjs.json"
}
```

## 5. Wire ESLint (flat config)

Add `eslint.config.ts` and compose layers from `@busirocket/eslint-config` (for
example `base`, then `nextjs` or `vite-react`). Use `jiti` or your bundler to
load TypeScript if needed.

## 6. Scripts

Add scripts such as `"lint": "eslint ."`, `"format": "prettier --write ."`, and
`"type-check": "tsc --noEmit"` to `package.json`.

## 7. Wire the quality gates

Add `@busirocket/quality-config` and generate the per-project config files from
its factories, instead of copying JSON by hand:

```bash
pnpm add -D @busirocket/quality-config@^0.1.0 knip dependency-cruiser lefthook
```

```ts
// knip.config.ts
import { createKnipConfig } from '@busirocket/quality-config/knip'

export default createKnipConfig({ framework: 'nextjs' }) // or astro, nestjs, nuxt, tauri, ts-package, vite-react, vite-vue
```

`lefthook.yml` and `renovate.json` are plain YAML/JSON, not TypeScript factories
loaded at runtime - copy them from the closest matching template under
`templates/*/lefthook.yml` and `templates/*/renovate.json` (or from
`createLefthookConfig()` in `@busirocket/quality-config/lefthook` if generating
them programmatically), then run `pnpm exec lefthook install`.

`dependency-cruiser` only pays off once there is more than one package to graph;
a single-package repo can skip `deps:graph` until it becomes a monorepo. Every
gate's threshold and rationale is in
[quality-gates.md](../standards/quality-gates.md).

## 8. Optional CLI check

```bash
pnpm dlx @busirocket/create-baseline@^0.1.0 --check
```

Use `--soft` to print install hints without failing, or `--hard` to also require
an `eslint.config.*` and the quality-gate config files (`knip.config.ts`/`.js`,
`lefthook.yml`, `renovate.json`) to exist.
