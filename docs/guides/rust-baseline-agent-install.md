# cargo-baseline: agent install runbook

Deterministic, non-interactive procedure for an AI agent (or a human in a hurry)
to install the Rust baseline into any project. Every step states the command to
run and the check that proves it worked. Human-oriented rationale lives in
[rust-baseline-adoption.md](rust-baseline-adoption.md); this file is the
executable version.

Scope: installation and gate wiring only. Fixing the violations the gate reports
is a separate refactor effort (see the adoption guide's triage order).

## Step 0: install the binary

```bash
cargo install --git https://github.com/syntopica/codeality cargo-baseline --locked
# Local monorepo checkout alternative:
# cargo install --path <baseline-repo>/packages/cargo-baseline --locked
```

Verify: `cargo baseline --help` prints `check` and `init` subcommands. Once the
crate is published to crates.io, `cargo install cargo-baseline --locked`
replaces the --git form everywhere (including the CI workflow).

## Step 1: locate the Rust crate and classify the layout

Find the `Cargo.toml` that owns the source. Classify:

- **A. Single crate at repo root** (Cargo.toml + src/ at root).
- **B. Crate in a subdirectory** (e.g. Tauri: `src-tauri/Cargo.toml`).
- **C. Cargo workspace** (root Cargo.toml has `[workspace]`; may also have its
  own `[package]`).

Record the crate dir as `CRATE_DIR` (repo root for A/C, the subdir for B).

## Step 2: scaffold configs

```bash
cd "$CRATE_DIR" && cargo baseline init --ci
```

Verify: prints seven `write:` lines (or `skip:` for pre-existing files — never
overwrite; a `skip:` on baseline.toml means the project was already initialized,
stop and reconcile manually).

## Step 3: place the CI workflow (layouts B and C)

`init --ci` writes `.github/workflows/baseline.yml` relative to `CRATE_DIR`.
GitHub only reads workflows at the repo root.

- Layout A: nothing to do.
- Layout B: move the file to `<repo-root>/.github/workflows/baseline.yml`,
  delete the now-empty `$CRATE_DIR/.github`, and edit the workflow:
  - add under `jobs.check`:
    ```yaml
    defaults:
      run:
        working-directory: <CRATE_DIR>
    ```
  - `Swatinem/rust-cache@v2` step gets `with: workspaces: <CRATE_DIR>`
  - `EmbarkStudios/cargo-deny-action@v2` step gets
    `with: manifest-path: <CRATE_DIR>/Cargo.toml`
- All layouts: while the crate is unpublished, replace the
  `cargo install cargo-baseline --locked` step with
  `cargo install --git https://github.com/syntopica/codeality cargo-baseline --locked`.
- If a workflow named `baseline.yml` already exists at the root, merge by hand;
  do not clobber.

Verify: `git -C <repo-root> status` shows the workflow at root level only.

## Step 4: wire the lint set into Cargo.toml

`init` wrote `workspace-lints.toml` next to the crate as a paste source.

- Layout C (workspace): paste its `[workspace.lints.*]` tables verbatim into the
  ROOT Cargo.toml, then add to EVERY member crate's Cargo.toml:
  ```toml
  [lints]
  workspace = true
  ```
  (The `lints-inheritance` rule fails the check for any member missing this.)
- Layouts A and B (single crate): convert each `[workspace.lints.X]` header to
  `[lints.X]` (contents verbatim) and append to the crate's Cargo.toml.

Permitted adaptations (record each one as a comment above the table):

- `unsafe_code = "warn"` instead of `"deny"` ONLY if
  `grep -rn "unsafe " src/ --include='*.rs'` shows a required unsafe block (e.g.
  an FFI/JNI entrypoint). Name the file in the comment.
- Nothing else. Do not soften the clippy denies; do not delete lints.

Verify: `cargo check` still exits 0 (new WARNINGS are expected and fine; a build
ERROR means a deny lint hit — resolve per the rule above or stop and report).

## Step 5: first check run

```bash
cd "$CRATE_DIR" && cargo baseline check; echo "exit: $?"
```

Notes for correct interpretation:

- Capture the exit code directly, NOT through a pipe (`check | tail` returns
  tail's exit code).
- Non-zero exit with `error[...]` lines is the EXPECTED outcome on an existing
  codebase: it is the debt inventory, not a tool failure.
- Tool failure signals (stop and report a cargo-baseline bug): a panic, or
  `error[parse-error]` on a file that `cargo check` accepts.

Record the summary line (`baseline: N errors, M tips`) and the per-rule counts
(`grep -o 'error\[[a-z-]*\]' out.txt | sort | uniq -c`).

## Step 6: commit

Commit exactly these paths (nothing else):

- `.github/workflows/baseline.yml` (repo root)
- `$CRATE_DIR/{baseline.toml,clippy.toml,rustfmt.toml,deny.toml,rust-toolchain.toml,workspace-lints.toml}`
- The edited Cargo.toml(s)

Message shape: `chore: adopt cargo-baseline structural gate`, body stating the
current error count and any lint adaptation made. Follow the target repo's
commit conventions.

## Step 7: report

Tell the human:

1. The summary line and per-rule counts from Step 5.
2. Any adaptation made in Step 4 (with the file that forced it).
3. That CI's baseline job stays red until the violations are refactored, and
   that clippy/fmt steps may also be red on a legacy codebase (the adoption
   guide's ratchet + triage order is the fix path — do not start that refactor
   as part of installation).

Worked example: consumer-o (`~/p/consumer-o`, layout B, Tauri, one JNI unsafe
adaptation, 156 errors at adoption) — commit `f061a5f` in that repo shows the
exact target state of every file.
