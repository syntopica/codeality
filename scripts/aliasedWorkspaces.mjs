// Workspaces that map a path alias (`@/`, `~/`) through their own tsconfig
// "paths". dependency-cruiser takes a single `tsConfig` per cruise, so the
// repo-wide `pnpm deps:graph` cannot resolve more than one of these mappings -
// pointing it at one workspace's tsconfig would apply that mapping to every
// other cruised file, producing wrong edges rather than no edges.
//
// Single source of truth for both halves of that split, so they cannot drift:
// `.dependency-cruiser.cjs` excludes these workspaces from `no-orphans`, and
// `scripts/deps-graph-aliased.mjs` cruises each one on its own to cover them.
// Adding an alias to a workspace means adding it here, and nowhere else.
//
// `sources` are relative to the workspace and mirror what the repo-wide run
// would otherwise have cruised there.
export const ALIASED_WORKSPACES = [
  { workspace: 'packages/eslint-plugin-code-policy', sources: ['src'] },
  { workspace: 'templates/vue-app', sources: ['src'] },
  { workspace: 'templates/nuxt-app', sources: ['app', 'server'] },
]
