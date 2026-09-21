# Rust Baseline — Design

Date: 2026-07-23 Status: Approved (pending spec review)

## Goal

Bring the TypeScript baseline discipline (atomic files, placement, size caps, no
inline SQL) to Rust projects, as a package inside this monorepo, strict enough
that LLM-generated code cannot produce 4000-line files.

Evidence from real projects:

- `consumer-o/src-tauri/src/store/sqlite_store.rs`: 4,728 lines, 176 functions,
  inline SQL throughout (rusqlite), forced by a 464-line god trait
  (`store_trait.rs`) whose single `impl` block cannot be split across files.
- `consumer-t/src-tauri/src/lib.rs`: 177 lines mixing ~15 `#[tauri::command]`
  functions with wiring; grab-bag files (`file/operations.rs` 10 fns,
  `audio/metadata.rs` 8 fns).
- Both real Rust projects are Tauri apps using rusqlite (not sqlx).

## Shape and distribution

New crate: `packages/cargo-baseline/` (Rust, own `Cargo.toml`). A minimal Cargo
workspace file at the repo root lists it; coexists with the pnpm workspace.
Published to crates.io as `cargo-baseline` under BusiRocket.

Rust has no ESLint-style config extension, so distribution is init-and-upgrade
(the `cargo deny init` pattern):

- `cargo baseline init` — scaffolds into a consumer project: `baseline.toml`
  (rule config), `clippy.toml`, `rustfmt.toml`, `deny.toml`, and a
  `[workspace.lints]` block for `Cargo.toml`.
- `cargo baseline check` — parses every `.rs` file with `syn` on the stable
  toolchain, runs structural rules, emits `file:line: error[rule-name]`
  diagnostics. Exit code non-zero on any error. Intended as CI and pre-commit
  gate.

Enforcement route decision: `syn`-based tool over Dylint. Dylint offers
compiler-integrated lints but pins a nightly toolchain and breaks with rustc
internals — wrong trade-off for a tool reused across many projects. Clippy
covers complexity and function length; it has no rules for one-unit-per-file,
SQL bans, or placement, which is exactly what the custom tool adds.

## Structural rules (v1)

| Rule                      | Enforces                                                                                                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `one-primary-unit`        | One public item (struct/enum/trait/fn/type alias) per file. Its inherent `impl` and trait impls (`Display`, `From`, serde) stay in the same file. Private helper `fn`s banned — extract to own file and import.                                                                           |
| `max-file-lines`          | Hard cap 150 lines (skips blank lines and comments). Configurable per project in `baseline.toml`.                                                                                                                                                                                         |
| `no-inline-sql`           | SQL string literals (`SELECT`, `INSERT INTO`, `UPDATE`, `DELETE FROM`, `CREATE TABLE`, …) banned in `.rs` files. SQL lives in `sql/*.sql`, loaded via `include_str!("sql/foo.sql")` — works with both rusqlite and sqlx (`query_file!`). Schema and migrations also live in `.sql` files. |
| `max-trait-methods`       | Cap ~12 methods per trait (configurable). Root-cause rule: the 4,728-line file exists because a 464-line trait forces a monolithic `impl` block. Pushes interface segregation.                                                                                                            |
| `barrel-only-mod`         | `mod.rs` and `lib.rs`: only `mod` declarations, `pub use` re-exports, and attributes. Zero logic. Tauri entrypoint carve-out: `lib.rs` may additionally contain the `run()` builder function (mirrors the TS app-router carve-out).                                                       |
| `tauri-command-placement` | `#[tauri::command]` functions only under `commands/`, one command per file, thin wrapper delegating to a domain function.                                                                                                                                                                 |
| `file-matches-item`       | File name must be the snake_case of the primary item (`user_repository.rs` → `UserRepository`). Explicit ban list for grab-bag names: `utils.rs`, `helpers.rs`, `misc.rs`, `common.rs`.                                                                                                   |

Test exemption: `#[cfg(test)]` modules and `tests/` directories are exempt from
`one-primary-unit`, `file-matches-item`, and `max-file-lines` (mirrors the TS
test carve-outs).

Module boundaries need no custom rule: Rust visibility (`pub(crate)`,
`pub(super)`) covers what `frontend-boundaries` does in TS. The init template
documents the convention.

## Tips engine (advisory, non-blocking)

`cargo baseline check` emits a `tip[...]` section after errors: heuristic,
detector-based recommendations that never affect the exit code. v1 tips:

- rusqlite detected → suggest migrating to a typed data layer: sqlx with
  compile-time-checked queries (`query_file_as!`) or SeaORM, so the schema and
  row mappings are type-checked instead of stringly typed.
- Hand-rolled `Row → struct` mapping functions detected alongside rusqlite →
  same suggestion, pointing at the mapping boilerplate as migration payoff.
- `unwrap()`/`expect()` density above threshold in non-test code → suggest
  error-type consolidation (`thiserror`).
- Oversized crate (see thresholds below) → suggest workspace split.
- `anyhow` in a library crate → suggest typed errors (`thiserror`).

Tips configurable (on/off per tip) in `baseline.toml`.

## Large-project best practices (baked into init + rules)

Researched against current community practice (egui's curated workspace lints,
cargo-workspace-lints, workspace organization guides):

- **Workspace-first architecture.** Flat `crates/` layout; split by domain when
  coupling hurts, not preemptively. Tool support:
  - Tip: a crate exceeding thresholds (default: 75 source files or 8,000 total
    lines, configurable) → suggest splitting into workspace crates (faster
    incremental compiles, compiler-enforced boundaries).
  - Rule `lints-inheritance`: every workspace member's `Cargo.toml` must contain
    `[lints] workspace = true` — a forgotten member silently skips the whole
    lint baseline (this is what cargo-workspace-lints exists for; trivial for us
    to check by parsing TOML).
- **Toolchain hygiene from `init`**: `rust-toolchain.toml` (pinned channel),
  `rust-version` (MSRV) and `edition = "2024"` in Cargo.toml,
  `[workspace.dependencies]` so every member inherits one version per dep.
- **Error-handling convention**: `thiserror` for library crates, `anyhow` only
  at binary edges. Tip: `anyhow` in a lib crate's dependencies → suggest typed
  errors.
- **CI recipe**: `cargo baseline init --ci` writes a GitHub Actions workflow:
  `cargo fmt --check`, `cargo clippy --workspace --all-targets -D warnings`,
  `cargo test --workspace`, `cargo deny check`, `cargo baseline check`.

## Complexity and style (delegated to standard tools, shipped by init)

- `[workspace.lints.rust]`: `unsafe_code = "deny"`, `rust_2018_idioms`,
  `unsafe_op_in_unsafe_fn`, `missing_debug_implementations`,
  `elided_lifetimes_in_paths`, `unused_crate_dependencies` = warn (catches
  unused deps without needing cargo-machete; documented bench caveat).
- `[workspace.lints.rustdoc]`: `broken_intra_doc_links = "deny"`.
- `[workspace.lints.clippy]`: `all` = warn, plus curated `pedantic`/`nursery`
  selections egui-style (with an explicit allow-list for the noisy ones, e.g.
  `module_name_repetitions`); deny: `unwrap_used`, `expect_used`, `panic`,
  `todo`, `indexing_slicing`, `dbg_macro`, `print_stdout`,
  `cognitive_complexity`.
- `clippy.toml`: `too-many-lines` (function cap 50), `too-many-arguments` 4,
  `cognitive-complexity-threshold` 10 — mirrors the TS numbers.
- `rustfmt.toml`; `deny.toml` (licenses, duplicate deps, advisories).

## Testing

Per rule: fixture `.rs` files (pass/fail pairs) plus assertions on emitted
diagnostics. Standard `cargo test`. Dogfood requirement: the crate must pass its
own `cargo baseline check`.

Verify command for the deliverable: `cargo test && cargo run -- baseline check`
(self-hosted on its own source).

## Monorepo and template integration

- Root `Cargo.toml` workspace listing `packages/cargo-baseline`.
- New `templates/tauri-app/`: Tauri + rusqlite-or-sqlx layout with `sql/`
  directory, pre-wired `baseline.toml`, `clippy.toml`, `rustfmt.toml`,
  `deny.toml`, wired into `create-baseline` like existing templates.
  (`rust-service` template deferred until a real non-Tauri case exists.)
- Turbo task optional later; cargo runs standalone.

## Out of scope

- Refactoring `consumer-o`'s `sqlite_store.rs` — separate effort in that repo;
  the tool detects it, it does not fix it.
- Dylint-based compiler lints.
- Auto-fix; v1 diagnoses only.
