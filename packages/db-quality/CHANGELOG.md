# Changelog

## 0.2.0

- Strict mode: no `info` severity, every finding fails the gate unless the
  baseline or a `disable` entry with a written `reason` covers it.
  `schemaVersion: 2`; a version 1 file still works and `init --apply` upgrades
  it.
- `BDB801`-`BDB805`: rules on the PostgREST query chains in `.ts`/`.tsx` sources
  under `postgrest.roots`.
- `perf snapshot`, `perf diff` and `perf bench`: `pg_stat_statements` and table
  statistics with an improvement report and `BDB901`-`BDB904`; the project's own
  bench queries under `EXPLAIN ANALYZE` with `BDB911`-`BDB913`. The `perf` gate
  stage runs them when `perf.inGate` is true and a target resolves.
- The live connection is `psql` with a session-level read-only `SET`: the
  Supabase pooler ignores `PGOPTIONS`.

## 0.1.0

- Initial release: `init`, `check`, `audit`, `gate`, `baseline`.
- Validated against thirteen repositories; see `docs/validation-2026-09.md`.
