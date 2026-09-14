# Python estate baseline pass

Date: 2026-08-31 Tool: `baseline-py` 0.1.0 Mode: **read-only**

Nothing was written to any repository. No `baseline-py.toml`, no `mypy.ini`, no
`.baseline-py-baseline.json` exists in any of the five projects; verified after
the pass. The uncommitted changes standing in `atrium` (`atrium/cli.py`,
`atrium/doctor/`) and `djplayerdeluxe` (`.gitignore`) are unrelated work in
progress, not products of this pass.

Adoption is deliberately **not** part of this report: it is a separate,
individually reviewed change per repository, because a baseline written against
a checker that later turns out to be wrong becomes a second estate-wide
migration.

## Findings

| Repository       | Roots scanned              | Files | Total | BPY001 | BPY002 | BPY003 | BPY004 | BPY005 | BPY006 |
| ---------------- | -------------------------- | ----: | ----: | -----: | -----: | -----: | -----: | -----: | -----: |
| `mempalace`      | `mempalace`, `tests`       |   250 |   615 |     72 |      3 |      0 |    105 |     33 |    402 |
| `clawd-pet`      | `.`, `tests`               |    57 |    67 |     24 |      4 |      1 |     16 |      0 |     22 |
| `agentmeter`     | `.`, `tests`               |    53 |    63 |     22 |      3 |      1 |     15 |      0 |     22 |
| `atrium`         | `atrium`, `tests`          |    79 |    59 |     16 |      2 |      0 |      1 |      0 |     40 |
| `djplayerdeluxe` | `sievem`, `utils`, `tests` |     8 |    20 |      0 |      3 |      7 |      0 |     10 |      0 |

## The roots are wrong in three of the five, and the report says so

This is the finding that matters most, because it is the one that could have
produced a false clean bill of health.

- **`djplayerdeluxe` scanned 8 files out of 56.** Its code sits in top-level
  directories that carry no `__init__.py`, so the automatic root discovery — top
  level packages, else `src/` — found only `sievem` and `utils`.
- **`agentmeter` and `clawd-pet` scanned from `.`**, since their Python lives
  under `host/src` while `pyproject.toml` sits at the repository root. The
  vendored `firmware/.pio/libdeps` tree was correctly excluded, but the roots
  are still an accident rather than a decision.

Every run prints the roots it used in its summary line, and the JSON document
carries them in `roots`. That is the difference between a wrong scan you can see
and one you cannot. Adoption for these three starts by declaring `source-roots`
explicitly.

## What the estate is actually made of

**Inline SQL is the largest single category: 486 findings, 402 of them in
`mempalace`.** It is a memory palace over SQLite, so this is structural, not
incidental. Externalising those queries is a project of its own and is the
clearest candidate for a first `[[overrides]]` entry with a stated reason, or
for a staged migration tracked in a baseline.

**`mempalace/mempalace/mcp_server.py` holds 183 top-level declarations** in
8,698 lines. It is followed by `palace.py` (61), `repair.py` (59), `cli.py` (59)
and `backends/chroma.py` (50). This is the exact failure the Rust baseline was
built to stop, reproduced in Python.

**137 files exceed their line cap**, with a median of **517** code lines and a
maximum of **5,911**. The distribution over the offenders is 230 / 319 / 517 /
828 / 1,417 at the 10th, 25th, 50th, 75th and 90th percentiles.

**`djplayerdeluxe` is the naming case.** Its entire `utils/` package trips
BPY003 — seven findings, one per module — and three modules disagree with the
unit they hold (`log.py` holding `DJPDLog`, `notifications.py` holding
`Notification`, `ffprobe.py` holding `probe`). The two firmware hosts each carry
the `host/tests/helpers.py` that motivated keeping tests subject to BPY003.

**Barrels do real work in two projects.** 33 `__init__.py` files in `mempalace`
and 10 in `djplayerdeluxe` define or call at module scope rather than
re-exporting.

## Two decisions the numbers settle

**The 150-line default stands.** The question was whether Python's density makes
150 too strict. The offenders' median is 517 and their 25th percentile is 319 —
the estate is not clustered just above the cap, it is far above it. A cap of 200
or 250 would still leave the overwhelming majority failing while weakening the
rule for new code. Keep 150, and 300 for tests.

**Several modules want the `entrypoint` role rather than a rename.** BPY002
fires on `claude_probe.py` and `provision_wifi.py` holding `main`, and on
`entrypoint.py` holding `dispatch`. Renaming every CLI entry module to `main.py`
would be worse than the problem; these are what the configured `entrypoint` role
exists for. `atrium`'s two BPY002 findings are genuine near-misses instead
(`workspace_scope.py` holding `workspace_clause`).

## Suggested adoption order

1. **`atrium`** — 59 findings, only one over the line cap, no grab-bag modules.
   The cheapest first adoption, and the one that proves the flow.
2. **`agentmeter`** and **`clawd-pet`** — near-identical shapes; declare
   `source-roots = ["host/src"]`, `test-roots = ["host/tests"]`, mark the two
   entrypoints, then work the ~22 multi-unit modules each.
3. **`djplayerdeluxe`** — small once the roots are declared, but the roots must
   be declared first or the scan means nothing.
4. **`mempalace`** — last, and with a recorded baseline from day one. 615
   findings is a migration, not a cleanup, and the inline SQL in particular
   needs a decision before any of it is touched.

## Reproducing this

```bash
for repo in ~/p/mem ~/p/mempalace ~/p/djplayerdeluxe \
            ~/p/esp32-amoled/agentmeter ~/p/esp32-amoled/clawd-pet; do
  uv run --project packages/baseline-py baseline-py check \
    --project "$repo" --format json > "/tmp/$(basename "$repo").json"
done
```

`check` never writes. Confirm with `git -C <repo> status --short` afterwards.
