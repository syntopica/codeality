# cargo-baseline

Structural linter and config scaffolder for Rust: atomic files, placement,
size caps, no inline SQL. Brings the same discipline as
`@busirocket/eslint-config` to Rust/Tauri crates.

- **Design spec:**
  [docs/superpowers/specs/2026-07-23-rust-baseline-design.md](https://github.com/BusiRocket/baseline/blob/main/docs/superpowers/specs/2026-07-23-rust-baseline-design.md).

## Install

```bash
cargo install cargo-baseline
```

## Usage

```bash
cargo baseline init [--ci]   # scaffold baseline.toml, clippy.toml, rustfmt.toml,
                              # deny.toml, rust-toolchain.toml, workspace-lints.toml
                              # (--ci also writes .github/workflows/baseline.yml)

cargo baseline check [PATH]  # run structural rules + tips over a crate or
                              # workspace (default PATH: .)
```

`check` exits non-zero if any error-severity rule fires - safe as a CI or
pre-commit gate. Tips never affect the exit code.

For `--ci`: move the generated workflow to the repo root's `.github/workflows/`
(add `defaults: run: working-directory: src-tauri` for crate-in-subdir layouts
like Tauri), and until `cargo-baseline` is published on crates.io, install it
with `cargo install --git https://github.com/BusiRocket/baseline cargo-baseline`.

## Enforcement

### Rules (error severity)

| Rule | Enforces | Default |
| --- | --- | --- |
| `max-file-lines` | Hard cap on code lines per file (blank/comment lines don't count). | 150 |
| `one-primary-unit` | One public item (struct/enum/trait/fn/type alias) per file; its inherent and trait impls stay with it, private helper fns are banned. | - |
| `no-inline-sql` | No SQL string literals in `.rs` files; load queries via `include_str!`. | - |
| `max-trait-methods` | Cap on methods per trait - root-causes god traits that force monolithic `impl` blocks. | 12 |
| `barrel-only-mod` | `mod.rs` / `lib.rs` hold only `mod` declarations and `pub use` re-exports (plus a `run()` fn carve-out in `lib.rs` for the Tauri entrypoint). | - |
| `tauri-command-placement` | `#[tauri::command]` fns only under `commands/`, one command per file, thin wrapper delegating to a domain fn. | - |
| `file-matches-item` | File name must be the snake_case of its primary item; grab-bag names (`utils.rs`, `helpers.rs`, `misc.rs`, `common.rs`) are banned outright. | - |
| `lints-inheritance` | Every workspace member's `Cargo.toml` has `[lints]` `workspace = true`. | - |

`parse-error` is also emitted (error severity) when a `.rs` file fails to
parse with `syn`.

### Tips (advisory, non-blocking)

| Tip | Suggests | Default threshold |
| --- | --- | --- |
| `rusqlite` | Migrate to a typed data layer (sqlx `query_file_as!` or SeaORM) instead of hand-rolled `Row` -> struct mappings. | rusqlite present in deps |
| `anyhow-in-lib` | Use typed errors (`thiserror`) in library crates; keep `anyhow` at binary edges. | lib crate (no `main.rs`) depending on anyhow |
| `unwrap-density` | Consolidate errors with `thiserror` once `.unwrap()`/`.expect()` calls pile up. | 10 |
| `oversized-crate` | Split into workspace crates (`crates/` flat layout). | 75 files or 8000 lines |

## `baseline.toml` reference

Written by `cargo baseline init`; all keys are optional and fall back to the
defaults above.

```toml
max_file_lines = 150
max_trait_methods = 12
crate_max_files = 75
crate_max_lines = 8000
unwrap_density = 10
disabled_rules = []
disabled_tips = []
```

- `max_file_lines` - code-line cap enforced by `max-file-lines`.
- `max_trait_methods` - method cap enforced by `max-trait-methods`.
- `crate_max_files` - file-count threshold for the `oversized-crate` tip.
- `crate_max_lines` - line-count threshold for the `oversized-crate` tip.
- `unwrap_density` - `.unwrap()`/`.expect()` call threshold for the
  `unwrap-density` tip.
- `disabled_rules` - rule names to skip entirely.
- `disabled_tips` - tip names to skip entirely.

## No inline SQL

`no-inline-sql` bans SQL string literals in `.rs` files, including inside
`format!`/query macros. Move each query to its own `sql/*.sql` file and load
it with `include_str!`:

```rust
// sql/get_user.sql
// SELECT id, name FROM users WHERE id = ?1

let sql = include_str!("../sql/get_user.sql");
let user = conn.query_row(sql, [id], |row| {
    Ok(User { id: row.get(0)?, name: row.get(1)? })
})?;
```

This works with rusqlite as-is and matches sqlx's `query_file!` convention.

## Test exemptions

Inline `#[cfg(test)]` test modules are exempt from `one-primary-unit` and
`file-matches-item`. `max-file-lines` additionally skips any file under a `tests`
path component (e.g. `src/tests/foo.rs`), not just files with "tests" in the
name. Integration tests under a top-level `tests/` directory are never scanned:
`check` only walks `src/`.

## Existing project?

See
[docs/guides/rust-baseline-adoption.md](https://github.com/BusiRocket/baseline/blob/main/docs/guides/rust-baseline-adoption.md)
for a step-by-step adoption walkthrough, or
[docs/guides/rust-baseline-agent-install.md](https://github.com/BusiRocket/baseline/blob/main/docs/guides/rust-baseline-agent-install.md)
for the deterministic runbook an AI agent can execute non-interactively.
