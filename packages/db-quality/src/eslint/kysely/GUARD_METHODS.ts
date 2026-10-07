// `$if` and `$call` hand the builder to a callback that may add the `where`;
// the rule reports only what it can prove, so either one counts as a guard.
/** Chain methods after `updateTable`/`deleteFrom` that bound, or may bound, the rows written. */
export const GUARD_METHODS = new Set(['where', 'whereRef', '$if', '$call'])
