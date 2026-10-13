// Two deep module edges every preset must report: a re-export and a literal
// dynamic import, both forms the import rules once missed.
export const DEEP_EDGES =
  "export { a } from '@pkg/core/src/a'\nexport const b = import('@pkg/core/src/b')\n"
