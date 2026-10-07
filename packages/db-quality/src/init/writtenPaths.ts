import type { ManagedFile } from '@/init/ManagedFile.js'

/** The paths `applyInit` writes for a plan: created or merged files that carry content. */
export const writtenPaths = (plan: ManagedFile[]): string[] =>
  plan
    .filter(
      (file) =>
        (file.disposition === 'create' || file.disposition === 'merge') &&
        file.content !== undefined,
    )
    .map((file) => file.path)
