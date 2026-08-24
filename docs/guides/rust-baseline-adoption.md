# Rust baseline adoption

Step-by-step for adopting `cargo-baseline` in an existing Rust or Tauri project
(e.g. a Tauri app with the Rust side under `src-tauri/`). See
[packages/cargo-baseline/README.md](../../packages/cargo-baseline/README.md) for
the full rule/tip reference and
[docs/superpowers/specs/2026-07-23-rust-baseline-design.md](../superpowers/specs/2026-07-23-rust-baseline-design.md)
for the design rationale. For a non-interactive, command-by-command version that
an AI agent can execute, see
[rust-baseline-agent-install.md](rust-baseline-agent-install.md).

## 1. Scaffold

Run `init` in the crate directory (for a Tauri app, that's `src-tauri/`):

```bash
cd src-tauri
cargo baseline init --ci
```

This writes `baseline.toml`, `clippy.toml`, `rustfmt.toml`, `deny.toml`,
`rust-toolchain.toml`, `workspace-lints.toml`, and (with `--ci`)
`.github/workflows/baseline.yml`. Existing files are skipped, never overwritten.

`--ci` writes the workflow file relative to the path you ran `init` in - for a
Tauri app that means it lands under `src-tauri/.github/workflows/baseline.yml`.
GitHub Actions only runs workflows from the repo root, so move it to
`.github/workflows/` at the repo root, and add a working-directory default so
the steps still run from the crate:

```yaml
defaults:
  run:
    working-directory: src-tauri
```

The generated workflow also runs `cargo install cargo-baseline --locked`, which
needs the crate published on crates.io. Until then, install from git instead:

```bash
cargo install --git https://github.com/BusiRocket/baseline cargo-baseline
```

## 2. Wire up lints

Paste the contents of `workspace-lints.toml` into your root `Cargo.toml`:

- Workspace: paste under `[workspace.lints.*]`.
- Single crate: convert `[workspace.lints.*]` to `[lints.*]` directly.

Then add to every workspace member's `Cargo.toml`:

```toml
[lints]
workspace = true
```

A member missing this block is exactly what the `lints-inheritance` rule
catches - it silently skips the whole baseline for that member otherwise.

## 3. First check run - triage order

```bash
cargo baseline check
```

On a real codebase this produces a lot of errors at once. Fix them in this
order, cheapest and highest-leverage first:

1. **`barrel-only-mod` / `file-matches-item` grab-bag violations first.** These
   are cheap, mechanical splits: pull logic out of `mod.rs`/`lib.rs`, rename
   `utils.rs`/`helpers.rs`/`misc.rs`/`common.rs` into files named after their
   actual unit. No design decisions required.
2. **`no-inline-sql` next.** Move each SQL string into its own `sql/*.sql` file
   and load it with `include_str!` (see the crate README's SQL pattern).
   Independent of the trait/file-size work below.
3. **`max-trait-methods` (god-trait split).** A store trait with 15+ methods
   forces a single giant `impl` block, which is usually what's blowing past
   `max-file-lines` on the store file. Split the trait into focused traits
   (interface segregation) - this alone often unlocks the file-size fix below
   without any further restructuring.
4. **Remaining `max-file-lines` / `one-primary-unit` splits.** Once the trait is
   segregated, split the `impl` blocks and any remaining multi-unit files one
   primary item per file.

## 4. Ratchet strategy

Don't try to hit the default caps in one PR on a large existing codebase.
Instead:

1. Temporarily raise `max_file_lines` in `baseline.toml` to your current worst
   offender's line count (so `cargo baseline check` passes today).
2. Lower it a bit on every subsequent PR that touches the affected files.
3. Never add rule names to `disabled_rules` as a way out - the ratchet only
   works if the rule stays on and the number keeps moving down.

## 5. Clippy adoption

Bring clippy in gradually rather than blocking CI on day one:

1. Run `cargo clippy --workspace --all-targets` locally with warnings (`-W`) and
   fix what's cheap.
2. Once the workspace is clean, switch CI to `-D warnings` so it stays clean
   (the `baseline.yml` workflow from `init` already runs
   `cargo clippy --workspace --all-targets -D warnings`).

## 6. Test scope

`cargo baseline check` walks `<crate>/src` only, so files under a cargo `tests/`
directory are never linted. Inside `src`, three forms count as test scope and
are skipped by the structural rules:

- an inline `#[cfg(test)] mod tests { ... }` block - its lines do not count
  against `max-file-lines`, and SQL inside it is not reported;
- a `tests` directory under `src` (`src/db/tests/mod.rs`);
- a file carrying the `#![cfg(test)]` inner attribute.

That third form is what a module declared as `#[cfg(test)] mod tests;` needs.
Without the attribute the file is scanned as production code: `no-inline-sql`
flags test-fixture SQL and `max-file-lines` charges the crate's budget for it.
Add the attribute to the module file rather than reshaping the layout:

```rust
// src/db/queries/tests.rs
#![cfg(test)]

use super::*;
```

The alternative - a `tests/mod.rs` with an inner wrapper module - runs into
clippy's `module_inception` when the wrapper is also called `tests`.

## 7. Cross-file duplication (jscpd)

`cargo-baseline` doesn't gate cross-file duplication itself, but the same jscpd
gate the rest of the baseline uses is installable without Node:

```bash
cargo install jscpd
```

Run it from the crate root: `jscpd .` honors the committed `.jscpd.json` the
same way the Node-based install does - keep that canonical config rather than
writing a separate one.

`cargo-dupes` (AST-normalized clone detection, cargo subcommand) and
`similarity-rs` (AST-based semantic similarity) are optional audit tools worth
running by hand for deeper matching. Both are noisier than jscpd's token-based
matching and are not wired in as CI gates.
