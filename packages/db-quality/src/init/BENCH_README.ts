import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'

/** Explains the bench directory convention to whoever finds it next. */
export const BENCH_README = `# Bench queries

Each \`.sql\` file in this directory holds one statement to benchmark. Write
literal values inline; the session that runs them has no way to bind
parameters.

An optional first line \`-- runs: N\` overrides how many times the statement
runs before the median is recorded, in place of \`perf.benchRuns\` in
codeality-db.json.

A file holding more than one statement is refused. The statement runs
inside a read-only transaction it cannot leave, and whatever it did is
rolled back, so a statement that writes is refused or undone instead of
touching the database.

Run \`codeality-db perf bench --record\` once to write the reference numbers
to ${BENCH_RECORD_FILENAME}. Run \`codeality-db perf bench\` afterwards to
compare a new run against that reference.
`
