# Changelog

## 0.2.1

- `init` proposes a PostgREST root only when it holds a TypeScript source; an
  empty or untracked directory such as a local `supabase/functions` no longer
  ends up in the configuration and fails CI.

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
  Supabase pooler ignores `PGOPTIONS`. A bench statement runs as a PL/pgSQL
  cursor inside a `DO` block, one statement only and always rolled back; a
  transaction pooler (port 6543) is refused; a `--db-url` password travels only
  through `PGPASSWORD`.
- `typescript` is loaded only when `postgrest` is configured; without it the
  other commands run, and the PostgREST rules exit 3 asking for it.
- `init` upgrades the workflow file of an earlier release, recognised by its
  SHA-256, instead of reporting it as a conflict.
- Validated against verticagtm and pxpn; see `docs/validation-2026-09.md`.

## 0.1.0

- Initial release: `init`, `check`, `audit`, `gate`, `baseline`.
- Validated against thirteen repositories; see `docs/validation-2026-09.md`.
