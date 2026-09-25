/** What the baseline still needs before `check` passes: nothing, a first file, or a rewrite covering new findings. */
export type BaselineStep = 'covered' | 'create' | 'update'
