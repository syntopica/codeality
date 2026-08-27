# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [~] `pnpm check:quality` failed once on a cold run and passed on every run
  after. **The reporting half is fixed; the original failure is still not
  reproduced.** `check:quality` was a `pnpm a && pnpm b && ...` chain, so the
  only thing a summary showed was the aggregate exit code - which is why the
  original report could never be acted on. It now runs
  `scripts/check-quality.mjs`, same first-failure semantics, printing
  `check:quality: FAIL     <step> (exit <code>)` and exiting with that step's
  code. The next occurrence names itself.

      Re-run 2026-08-25 from a deleted turbo cache
      (`rm -rf node_modules/.cache/turbo .turbo`): both
      `pnpm exec turbo run publish:check --force` and `pnpm check:quality`
      exited 0. Two concrete instances of the same class have been found and
      fixed, neither proven to be this one - 2026-08-24,
      `my-nextjs-app#type-check` depended on `^build` instead of its own
      `build`, so it read a `.next/types/routes.d.ts` nothing had written; and
      2026-08-25, pnpm does not relink a workspace package's bins when only
      that package's `bin` map changes, so `pnpm type-coverage` died with
      `sh: baseline-type-coverage: command not found` until
      `node_modules/.pnpm-workspace-state-v1.json` and
      `node_modules/.package-map.json` were deleted and reinstalled (documented
      in `docs/standards/quality-gates.md`; CI installs from scratch and never
      sees it). Close this when a cold run fails again and names its step, or
      when enough cold runs pass to call it gone.

- [ ] Conformance has no tsconfig column, and the defect it would have caught is
      the expensive kind: a gate that exits 0 while reading almost nothing.
      Found in `~/p/consumer-g` on 2026-08-27 (commit `cde3bc29`). That
      repository's root `tsconfig.json` is solution-style and references three
      projects, but its `type-check` script named only two of them, so `app/`,
      `proxy.ts` and `instrumentation.ts` — the largest surface in the repo —
      reached `check:ci` unchecked for months. Nothing in `runConformance` looks
      at TypeScript configuration at all (`checkGateCoverage`, `checkLintFlag`,
      `checkVersionRanges`, `checkCiWorkflow`, `checkCoverageThresholds`,
      `checkActionPins`, `checkHooksInstalled`), so `pnpm estate ~/p` reported
      that repository as conformant while a third of it was outside the gate.
      The first check to add: every project a solution root references appears
      in `type-check` — purely structural, no TypeScript needed: read the root's
      `references`, read the `type-check` script, diff. This is the one that
      pays.

- [ ] Second conformance check, after the one above: each leaf `tsconfig.*.json`
      extends an `@busirocket/tsconfig` preset. In consumer-g only
      `tsconfig.app.json` did; `tsconfig.node.json` and `tsconfig.next.json`
      were hand-written and weaker than `base.json` — no
      `noUncheckedIndexedAccess`, no `exactOptionalPropertyTypes`, no
      `noImplicitOverride`, and `allowJs` on the Next one. A repository can
      carry the dependency, pass every current column, and still not be on the
      baseline. Note for whoever writes it: the root itself must NOT extend a
      preset when it is solution-style, so the check has to tell the two shapes
      apart rather than asserting `extends` everywhere. See the docs item below.

- [ ] `@busirocket/tsconfig`'s README only documents the single-project shape,
      and the multi-project one has now been got wrong twice in the same
      repository within two days. Its example is a root `tsconfig.json` that
      extends `nextjs.json` directly. A repository with several projects needs
      the opposite: the root stays `{"files": [], "references": [...]}` and the
      presets go on the leaves. This is not a style preference —
      `baseline-type-coverage` (quality-config 0.10.0+) walks a solution root's
      references to find the projects, so a root that extends a preset instead
      of referencing hands the runner one project and hides the rest. On
      2026-08-26 that exact shape made the runner answer
      `type-coverage: ok . 0 / 0` in `~/p/consumer-g`, and on 2026-08-27 the
      repository's own backlog carried an item proposing to "fix" it by making
      the root extend the preset — which would have re-broken it. Document the
      two shapes and say which gate depends on which.

- [ ] `nextjs.json` docs: never include `.next/dev/types` in a project the gate
      compiles; it cost a day downstream and is not discoverable from the
      preset. The README's example correctly names `.next/types/**/*.ts`,
      written by `next build`. Next 16 also writes `.next/dev/types` during
      `next dev`, and a stale or half-written `validator.ts` there fails to
      parse with `TS1434: Unexpected keyword or identifier` — on consumer-g's
      tree the generated file was missing the `import type` on one line. The
      failure lands on a gitignored dev artifact rather than on any source file,
      which makes it look unfixable, and the reasonable-looking response is to
      drop the whole Next project from `type-check`. That is exactly what had
      happened there.

- [ ] `nextjs.json` docs: Next does not rewrite a tsconfig the preset has
      already completed. Consumers routinely add their Next tsconfig to
      `.prettierignore`, and the comment above it always says Next rewrites the
      file on every build. `writeConfigurationDefaults` only writes when a
      required option is MISSING FROM THE RESOLVED CONFIG, and the preset
      supplies them — verified on consumer-g through the real path, not by
      reading Next's source: `next build` exits 0 and `next dev` boots, and both
      leave the file byte-identical. So a repository on the preset can take that
      file out of `.prettierignore` and have it formatted like everything else.

- [ ] Say in the adoption docs what turning the base's strictness on actually
      costs, because the honest number is reassuring rather than alarming and
      the shape of it is predictable. Composing `node.json` and `nextjs.json` in
      `~/p/consumer-g` surfaced 33 pre-existing findings — 26 type errors from
      `noUncheckedIndexedAccess` and 7 ESLint errors the same narrowing exposed
      (`restrict-template-expressions`, `no-unnecessary-condition`,
      `no-unsafe-argument`). Every one was in `scripts/` and `e2e/`; `src/` and
      `app/` came through clean. Two were real bugs rather than missing
      narrowing, both the same shape: `name in     obj` used to validate a key,
      which accepts inherited prototype keys, so `--arms=toString` passed an
      unknown-arm check. `Object.hasOwn` is the fix, and it is worth naming in
      the docs because the pattern is everywhere in CLI argument handling.

- [ ] Two adoption notes that follow from the item above: the lint wave arrives
      WITH the tsconfig change, not after it, so `eslint-config` and `tsconfig`
      should be adopted in one pass rather than two; and the fixes belong at the
      source — a verification script that falls back to `''` instead of failing
      loudly turns a real failure into a false pass, which is worse than the
      unchecked access was.

## Test strength

- [ ] `packages/eslint-plugin-code-policy` scores **60.80%** on mutation testing
      against a suite with ~100% line coverage: 678 mutants killed, **374
      survived**. The rule suites execute every branch and assert loosely - a
      changed `messageId`, a report moved to a different node, or an inverted
      boundary condition usually survives. Coverage cannot see this, which is
      the whole reason the gate was added. Run it with
      `pnpm --filter eslint-plugin-code-policy run mutation`.

  `thresholds.break` is 60 in `stryker.config.mjs`, just under the measured
  score, so the number can only ratchet upward. The work is per rule and
  independent: take one file from the table (`atomic-file.ts` is worst at
  49.72%), read its surviving mutants, tighten the assertions that let them
  live, then raise `break` to the new floor.

## Estate

- [ ] Bring the rest of the estate up to the wiring the conformance check now
      asserts. `pnpm estate ~/p` prints the matrix; 22 of 23 consumers fail at
      least one column.

  `create-baseline --fix` repairs the mechanical half - the `--max-warnings 0`
  flag, gates missing from `check:*`, coverage thresholds, the CI workflow,
  stuck version ranges. The rest needs a decision per repository. The four
  `client-widgets-*` widgets are the largest gap: they predate
  `@busirocket/quality-config` entirely and sit four minors behind on
  `eslint-config`.
