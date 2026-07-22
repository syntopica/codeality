# cargo-baseline real-world report: project-after and consumer-t

Date: 2026-07-23

`cargo-baseline` was run read-only against two real Tauri projects to
validate the tool on production code and scope the project-after adoption effort.
Neither repo was modified (no `baseline.toml`, no `init`).

## Method

```bash
cargo run -p cargo-baseline -- baseline check /Users/someone/p/project-after/src-tauri
cargo run -p cargo-baseline -- baseline check /Users/someone/p/consumer-t/src-tauri
```

Both runs exited non-zero, as expected (real violations, not tool failure).
Full raw output was captured for both runs; every line matches either a
`<path>:<line>: error[rule]: ...` / `tip[rule]: ...` diagnostic or the
final `baseline: N errors, M tips` summary - no unrecognized output, no
`panic`/`thread ... panicked`/`RUST_BACKTRACE`, and no `parse-error`
diagnostics anywhere. Crash gate: clean on both projects (542 project-after source
files, all parsed).

Summary lines (verbatim):

```
baseline: 156 errors, 3 tips        # project-after
baseline: 50 errors, 0 tips         # consumer-t
```

## project-after: errors by rule

| Rule | Count |
| --- | --- |
| `one-primary-unit` | 63 |
| `file-matches-item` | 47 |
| `no-inline-sql` | 32 |
| `max-file-lines` | 10 |
| `tauri-command-placement` | 3 |
| `max-trait-methods` | 1 |
| **Total** | **156** |

## project-after: tips

| Tip | Detail |
| --- | --- |
| `oversized-crate` | crate has 542 files / 24531 lines - consider splitting into workspace crates |
| `rusqlite` | rusqlite detected - consider a typed data layer (sqlx `query_file_as!` or SeaORM) |
| `unwrap-density` | 565 `unwrap()`/`expect()` calls (flagged on `src/ai/ai_provider.rs`) - consolidate errors with `thiserror` |

## project-after: top-10 files by diagnostic count

| # | File | Diagnostics |
| --- | --- | --- |
| 1 | `src/store/sqlite_store.rs` | 34 |
| 2 | `src/store/models/today_view.rs` | 13 |
| 3 | `src/sync_queue/run_sync_queue.rs` | 6 |
| 4 | `src/store/derive_account_status.rs` | 6 |
| 5 | `src/sync_queue/run_account_work.rs` | 5 |
| 6 | `src/store/apply_migration_011.rs` | 5 |
| 7 | `src/ai/draft_generation_slot.rs` | 4 |
| 8 | `src/sync_queue/run_account_cycle.rs` | 3 |
| 9 | `src/store/store_trait.rs` | 3 |
| 10 | `src/microsoft_oauth/access_token_for.rs` | 3 |

## consumer-t: errors by rule

| Rule | Count |
| --- | --- |
| `one-primary-unit` | 16 |
| `barrel-only-mod` | 15 |
| `tauri-command-placement` | 14 |
| `file-matches-item` | 4 |
| `max-file-lines` | 1 |
| **Total** | **50** |

No tips fired for consumer-t.

## consumer-t: worst files by diagnostic count

| # | File | Diagnostics |
| --- | --- | --- |
| 1 | `src/lib.rs` | 29 |
| 2 | `src/file/operations.rs` | 10 |
| 3 | `src/audio/metadata.rs` | 9 |
| 4 | `src/error.rs` | 1 |
| 5 | `src/audio/conversion.rs` | 1 |

## Headline findings: confirmed / adjusted

- **`sqlite_store.rs` size** - expected ~4.7k lines. Actual: `wc -l` = 4746
  total lines; the `max-file-lines` diagnostic counts 4204 code lines
  (max 150). Confirmed, this is the single worst offender in project-after (34
  diagnostics on its own, 32 `no-inline-sql` hits are almost entirely from
  this file).
- **`store_trait.rs` god trait** - expected. Confirmed: `Store` has 76
  methods (`max-trait-methods`, max 12), verified independently by
  `grep -c '    fn '` against the trait body. One trait forces the file
  past `max-file-lines` (233 code lines) too.
- **Inline SQL** - expected. Confirmed: 32 `no-inline-sql` hits across
  `src/store/sqlite_store.rs` and `src/store/apply_migration_011.rs`; no
  other files carry this rule in project-after.
- **consumer-t `lib.rs` commands** - expected. Confirmed: every
  `#[tauri::command]` in `lib.rs` (12 commands, 24 diagnostics: one
  `barrel-only-mod` + one `tauri-command-placement` per command site) plus
  the 5 remaining `tauri-command-placement`/`barrel-only-mod` hits from mod
  declarations bring the file to 29 diagnostics, by far consumer-t's worst
  file.
- No adjustment needed to the brief's expected findings; all four held up
  against the actual tool output.

## Recommended attack order for project-after

Per `docs/guides/rust-baseline-adoption.md` section 3, cheapest/highest-leverage
first:

1. **Barrel/grab-bag splits first** (`file-matches-item`, 47 hits; part of
   `one-primary-unit`'s 63). Mechanical renames/splits, no design work:
   e.g. `store_trait.rs` -> `store.rs`, `readwrite.rs` -> `read_write.rs`,
   the whole `commands/attachment/*.rs` set (7 files), all `email/models/*.rs`
   files. No decisions required.
2. **SQL extraction next** (`no-inline-sql`, 32 hits, concentrated in
   `sqlite_store.rs` and `apply_migration_011.rs`). Move each literal to
   `sql/*.sql` and load with `include_str!`. Independent of the trait/file-size
   work below, can run in parallel with step 1.
3. **Store trait segregation** (`max-trait-methods`, 1 hit but the highest-leverage
   fix in the repo: 76 methods on `Store`). Split into focused traits
   (interface segregation). This is expected to also resolve or shrink the
   `max-file-lines` violation on `store_trait.rs` (233 lines) and unlock
   splitting the giant `impl Store for SqliteStore` block in `sqlite_store.rs`
   without further restructuring.
4. **Remaining file splits** (`max-file-lines`, 10 hits; remaining
   `one-primary-unit` extras). After steps 1-3, `sqlite_store.rs` (4204 code
   lines) is the main target - split per-domain impl blocks (feed, folders,
   messages, migrations) into separate files once the trait is segregated.
   Also: `today_view.rs` (192 lines, 10 DTOs bundled), `derive_account_status.rs`
   (237 lines), `run_sync_queue.rs`/`run_account_cycle.rs`/`run_account_work.rs`
   (each 165-226 lines).
5. **Ratchet `max_file_lines`.** Given `sqlite_store.rs` at 4204 code lines,
   set an initial ratchet ceiling above that (e.g. 4300) so `check` passes
   today, then lower it on every PR that touches the file per the guide's
   ratchet strategy - never add rules to `disabled_rules`.

consumer-t is much smaller (50 errors, no tips) and can likely go straight
to `init` + steps 1 and 4: split `lib.rs`'s 12 commands into `commands/`
(one file per command, thin wrapper delegating to `audio`/`file` domain
functions - this clears both `barrel-only-mod` and `tauri-command-placement`
at once), then split `file/operations.rs` (9 functions) and
`audio/metadata.rs` (171 code lines, 7 extra units).

## Starter commands

```bash
# project-after
cd /Users/someone/p/project-after/src-tauri
cargo baseline init --ci
# paste workspace-lints.toml into the workspace root Cargo.toml,
# add [lints]\nworkspace = true to every member Cargo.toml
cargo baseline check   # expect 156 errors on first run; raise max_file_lines
                        # ratchet ceiling to >=4204 before this passes

# consumer-t
cd /Users/someone/p/consumer-t/src-tauri
cargo baseline init --ci
cargo baseline check   # expect 50 errors on first run
```
