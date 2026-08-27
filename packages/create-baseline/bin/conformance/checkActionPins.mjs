// `uses: owner/repo@ref` in a workflow. Local (`./.github/actions/x`) and
// container (`docker://`) references have no tag to move and are skipped.
const USES = /^\s*(?:-\s*)?uses:\s*['"]?([^'"\s#]+)['"]?/gm
const SHA_PINNED = /@[0-9a-f]{40}$/

/**
 * Every third-party action must be pinned to a commit SHA.
 *
 * A tag is mutable. Whoever controls the action repository can move `v6` to
 * any commit at any time, and every workflow referencing it runs the new code
 * on the next push with no diff in this repository to review. This is the
 * shape of the tj-actions/changed-files compromise, and it is not theoretical.
 *
 * One repository in the estate (consumer-g) pinned by SHA; the baseline repo
 * itself did not. That asymmetry is what this check exists to remove.
 */
export function checkActionPins({ workflows }) {
  const unpinned = new Map()

  for (const workflow of workflows) {
    for (const match of workflow.text.matchAll(USES)) {
      const ref = match[1]
      if (ref.startsWith('./') || ref.startsWith('docker://')) continue
      if (SHA_PINNED.test(ref)) continue
      if (!unpinned.has(ref)) unpinned.set(ref, new Set())
      unpinned.get(ref).add(workflow.name)
    }
  }

  if (!unpinned.size) return []

  return [...unpinned].map(([ref, files]) => ({
    id: `action-pin:${ref}`,
    level: 'error',
    message: `\`${ref}\` is pinned to a tag, not a commit`,
    detail:
      `In ${[...files].join(', ')}. Resolve it with ` +
      `\`gh api repos/${ref.split('@')[0]}/git/ref/tags/${ref.split('@')[1] ?? 'v1'}\` ` +
      '(dereference a second time through `git/tags/<sha>` if it reports an ' +
      'annotated tag) and keep the tag name as a trailing comment so Renovate ' +
      'can still offer the upgrade.',
  }))
}
