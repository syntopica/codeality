// GitHub Actions pinned to a commit SHA, not a tag.
//
// A tag is mutable: whoever controls the action repository can move `v6` to
// any commit at any time, and every workflow that references it runs the new
// code on the next push with no diff anywhere in this repo. A SHA cannot be
// moved. The trailing comment records which tag the SHA was resolved from, so
// Renovate can still offer the upgrade and a reader can still tell the version.
//
// Resolved via `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`. An annotated
// tag (pnpm/action-setup) points at a tag object, so its commit needs a second
// dereference through `git/tags/<sha>` - taking the first SHA would pin a
// tag object the runner cannot check out.
export const ACTION_PINS = {
  checkout: {
    uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    tag: 'v7',
  },
  setupNode: {
    uses: 'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
    tag: 'v7',
  },
  setupPnpm: {
    uses: 'pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413',
    tag: 'v6.1.0',
  },
  actionlint: {
    uses: 'raven-actions/actionlint@3d39aea434753780c3b3d4a1a31c854b4dbf49d7',
    tag: 'v2',
  },
  zizmor: {
    uses: 'zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482',
    tag: 'v0.6.4',
  },
}
