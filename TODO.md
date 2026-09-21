# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Work down the structural backlog left in five consumer repositories,
      measured 2026-09-17 with codeality-py 0.2.2: 194 accepted findings and 36
      mypy `ignore_errors` modules in the largest, then 64 and 51, 57 and 9, 26
      and 12, and atrium at 19 and 0. Every one reports `0 new`, so nothing is
      drifting; the debt is what adoption accepted. Coverage floors beside them:
      5%, 9%, 35%, atrium 54%, 78%. Each floor was measured and none may go
      down. brain, clips and syntopica are clear, as are the private consumers
      not listed here: their whole gate passes with an empty backlog. The five
      accepted starlette advisories in one of them still fall away when
      platformio 7 lands.

## Estate

- [ ] `@busirocket/eslint-config` 0.8.0 declares `@vitest/eslint-plugin` and
      `eslint-plugin-testing-library` as optional peers, but `code-quality.ts`
      composes `testing.ts` unconditionally, so every `/code-quality` consumer
      needs both or ESLint dies at config load with
      `Cannot find module '@vitest/eslint-plugin'`. Hit in `brain` on 2026-09-12
      by a routine dependency bump from 0.4.2: `pnpm install` was green, `lint`
      was red in both workspaces, and `pnpm peers check` had nothing to say
      because the peer is marked optional. The adoption guide already documents
      the pair as "easy to miss"; the package should say it too. Smallest step:
      drop `optional: true` for those two in `peerDependenciesMeta`, so the
      install warns instead of the lint crashing.

- [ ] `createNextjsConfig` enables `react/prop-types` through
      `react.configs.flat.recommended`, and the rule cannot see through
      `forwardRef`'s generic: every ref-forwarding primitive that destructures
      its props (`TableCell`, `Input`, shadcn's whole `ui/` folder) reports
      `'className' is missing in props validation`. In a TypeScript project the
      prop types are the validation, so adopters turn the rule off for
      `**/*.tsx` by hand (one consumer, 2026-09-08). Smallest step: the nextjs
      and vite-react layers set `react/prop-types: 'off'` for `.tsx` files
      themselves.

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

- [ ] **knip 6.35 reports the default export of `vite.config.ts` as unused when
      the framework preset lists `vite.config.*` under `entry`.** The Vite
      plugin already treats that file as an entry whose exports are ignored;
      naming it again as a plain project entry now surfaces
      `Unused exports: default vite.config.ts`. A consumer hit it the day knip
      moved 6.34 -> 6.35.1 (2026-09-12) and worked around it by overriding
      `entry: ['src/main.{ts,tsx}']` in its `knip.config.ts`. Fix in
      `knip-framework.ts`: drop `vite.config.*` from the `tauri`, `vite-react`,
      `vite-vue` and TanStack presets, or mark it as an entry with exports
      ignored, then re-run the affected repos' `pnpm knip`.
- [ ] **commitlint's `type-enum` rejects `todo:`**, the subject every repo here
      uses for backlog commits (5 of one consumer's last 12). No sibling repo
      has wired the `commit-msg` hook yet, so the day one does, the standard
      blocks the convention estate-wide. Either add `todo` to the shared list or
      state that backlog commits use `docs(todo):`. Evidence: a consumer run
      2026-09-09, `@commitlint/cli` declared there with nothing running it (its
      single knip finding).
- [ ] **`@busirocket/eslint-config` pulls `@eslint/js@10.0.1`, whose peer is
      `eslint ^10`, against the installed `eslint 9.39.5`.** Pre-existing in a
      consumer's HEAD lockfile and warns on every install; decide whether the
      config moves to ESLint 10 or pins `@eslint/js` 9.
- [ ] **Adoption guide: the `vite-react` tsconfig's
      `noPropertyAccessFromIndexSignature` and the quality-config lint rules
      break `check:ci` on adoption in any repository written before them.** One
      consumer needed three commits (12 TS4111 in a Vite plugin directory, 41
      lint errors, knip on the Homebrew `gitleaks` binary and an unused
      `@commitlint/cli`) before a single backlog item could land; the 1352-error
      case in another is the same shape. Worth a documented first step (bracket
      access sweep, `.prettierignore` for `.serena/`, knip ignores) rather than
      a surprise per repo.
