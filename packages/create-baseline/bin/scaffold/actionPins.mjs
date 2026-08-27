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
    uses: 'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803',
    tag: 'v6',
  },
  setupNode: {
    uses: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38',
    tag: 'v6',
  },
  setupPnpm: {
    uses: 'pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86',
    tag: 'v6',
  },
  actionlint: {
    uses: 'raven-actions/actionlint@3d39aea434753780c3b3d4a1a31c854b4dbf49d7',
    tag: 'v2',
  },
  zizmor: {
    uses: 'zizmorcore/zizmor-action@3dc1ecc9bcb9e94e9b2c709687979e1298497054',
    tag: 'v0.6.2',
  },
}
