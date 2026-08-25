# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [!] Three `pnpm-workspace.yaml` security overrides remain load-bearing.
  Re-verified 2026-08-24 by deleting all three and reinstalling: `pnpm audit`
  went from 2 findings (1 low, 1 moderate) back to 9, of which 4 high - `tmp`
  (GHSA-ph9p-34f9-6g65, via `@lhci/cli>inquirer>external-editor`), `sharp`
  (GHSA-f88m-g3jw-g9cj, via next) and PostCSS twice (GHSA-6g55-p6wh-862q /
  GHSA-r28c-9q8g-f849, via next). Each still carries its own weight. `@lhci/cli`
  is still 0.15.1, so `tmp` has no newer floor at all. The `next` entries clear
  when the template can move past 16.2.12, which is now blocked on something
  concrete rather than the release-age cooldown: Next 16.3.x rejects the
  `npm:@typescript/typescript6` alias, so the template pins Next exactly.
  Unblock by testing the alias against 16.3.x and, if it works, widening the pin
  and dropping whichever advisory does not return.

- [ ] Two advisories sit below the `--audit-level=high` gate and are
      deliberately not overridden: `uuid@<11.1.1` (moderate,
      GHSA-w5hq-g745-h8pq, via `@lhci/cli > uuid`) and
      `esbuild >=0.27.3 <0.28.1` (low, GHSA-g7r4-m6w7-qqqr, via
      `eslint-plugin-code-policy`'s own tsup and vitest toolchains). The
      `overrides:` block is scoped by its own comment to `high` findings, so
      forcing these would contradict the stated policy and pin two more
      transitive edges for no gate benefit. Both re-measured 2026-08-24 and
      unchanged. Expected to clear when Renovate bumps `@lhci/cli`, `tsup` and
      `vitest`; revisit only if either is re-scored `high`.

- [ ] `pnpm check:quality` failed once on a cold run and passed on every run
      after. One concrete instance of the same class was found and fixed on
      2026-08-24: `my-nextjs-app#type-check` reads `.next/types/routes.d.ts`
      through the committed `next-env.d.ts`, a file only `next build` writes,
      while the generic `type-check` task depended on `^build` - upstream
      packages, not itself. It now depends on its own `build`. The original
      `check:quality` report is not proven to be that same hazard: the chain
      ends in `publish:check`, and `pnpm exec turbo run publish:check --force`
      from a cleared cache passed on 2026-08-24. Reproduce and capture which
      task fails rather than the aggregate exit code.

- [ ] **`cargo baseline check` never looks at `<crate>/tests/`.** It walks
      `<crate>/src` only, so cargo integration tests are outside every rule -
      not exempted, never read. That is defensible for the structural rules and
      wrong for `no-inline-sql`, which would have something to say about a
      1,000-line fixture. Decide whether integration tests are in scope; if they
      are, `parse_source_files` needs a second root.

- [ ] **`unwrap-density` counts test `unwrap()`s, and reports them against the
      wrong file.** The crate's own tip reads
      `./src/baseline_command.rs:1: tip[unwrap-density]: 54 unwrap()/expect()     calls`,
      but that file is 20 lines long: 54 is the crate total pinned to an
      arbitrary path and line 1. Most of those calls sit in `#[cfg(test)]`
      modules where `.unwrap()` is the point - the same asymmetry
      `max-file-lines` had until inline test modules stopped counting.
      `engine/cfg_test_line_ranges` already returns the ranges the tip would
      need. Fix both together: exclude test scope from the count, and either
      report the tip without a file:line or attach it to the worst offender.

- [ ] **`detect-file-kind` anchors its suffix checks on `.ts`, so every `.tsx`
      twin escapes placement entirely.** `endsWith('Formatter.ts')`,
      `'Validator.ts'`, `'Mapper.ts'`, `'Transformer.ts'` and `'Selector.ts'`
      never match a `.tsx` file, and the camelCase-prefix branch only catches
      names that _start_ with the kind. Probed 2026-08-25 in
      `templates/nextjs-app`: `src/probe/userMapper.ts` reports
      `code-policy/file-kind-placement`, and `src/probe/orderMapper.tsx` next to
      it reports nothing. In a React codebase the `.tsx` half is exactly where
      mappers and formatters get written. Smallest step: strip the extension
      before the suffix comparison, then check what that surfaces in the
      templates before shipping it.

- [ ] **`is_cfg_test_item` only recognises a bare `#[cfg(test)]`.** It parses
      the attribute arguments as a single `syn::Ident`, so any compound
      predicate fails. Probed 2026-08-25: `#[cfg(all(test, feature = "x"))]` and
      `#[cfg(any(test, debug_assertions))]` both return `false`. Every rule that
      skips test scope goes through this one function - `max-file-lines`,
      `one-primary-unit`, `file-matches-item`, `no-inline-sql` and the new
      `sync-tauri-command` - so a crate that gates its tests behind a feature
      has all of them scanning its test modules as production code. Smallest
      step: parse the args as a `syn::Meta` list and look for a `test` ident
      anywhere inside `all(..)` / `any(..)`.

- [ ] **`.jscpd.json` is copied nine times, byte for byte.** Root plus all eight
      templates, one identical checksum across the lot
      (`find . -name .jscpd.json -not -path '*/node_modules/*' | wc -l` gives 9,
      `md5 -q` deduplicates to 1). Every other gate ships as a factory from
      `@busirocket/quality-config` - knip, dependency-cruiser, lefthook,
      type-coverage - and this one is hand-maintained duplication a consumer
      also has to copy. Smallest step: export a `createJscpdConfig` and make
      each template's config a one-line re-export, the way `knip.config.ts`
      already is.

- [ ] **clippy is configured but nothing runs it.**
      `packages/cargo-baseline/Cargo.toml` declares `[lints.clippy]` with
      `unwrap_used = "deny"`, `expect_used = "deny"` and `panic = "deny"`, and
      no gate enforces them: the `rust` CI job added 2026-08-24 runs
      `cargo fmt -- --check` and `cargo test --workspace` only. The crate is
      also outside the pnpm workspace - it has no `package.json` - so
      `turbo run lint` never reaches it either. A `deny` that fires only when
      somebody runs clippy by hand is a preference, not a lint. Smallest step:
      add `cargo clippy --workspace --all-targets -- -D warnings` to that job
      and burn down whatever it reports.

## Repo hygiene

- [ ] The three tags cut on 2026-08-04 (`eslint-config@0.6.0`,
      `quality-config@0.3.0`, `create-baseline@0.3.2`) are **lightweight**,
      while every tag before them is annotated (`git cat-file -t` returns `tag`
      for `eslint-config@0.5.0` and `commit` for these). They are already
      pushed, and a release tag is immutable, so they stay as they are. The
      thing to fix is the next release: create tags with `git tag -a -m`, or
      have `brp-release` do it, so the history stops mixing both kinds.
