/** The phased adoption ladder: what each phase means and the command that reaches the next one. */
export const ADOPTION_LADDER: Array<{
  phase: 0 | 1 | 2 | 3 | 4
  does: string
  next: string
}> = [
  { phase: 0, does: 'no configuration', next: 'codeality-db init --apply' },
  {
    phase: 1,
    does: 'strict check and PostgREST rules, baseline covers what exists',
    next: 'codeality-db perf snapshot',
  },
  {
    phase: 2,
    does: 'perf snapshot recorded',
    next: 'codeality-db perf bench --record',
  },
  {
    phase: 3,
    does: 'bench reference recorded',
    next: 'set perf.inGate to true in codeality-db.json',
  },
  {
    phase: 4,
    does: 'the gate measures performance',
    next: 'nothing: the gate measures',
  },
]
