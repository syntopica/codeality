/**
 * Entry and project globs per template framework, consumed by createKnipConfig.
 *
 * `includeEntryExports` says whether an entry file's own exports are checked.
 * It is true only where the entries are hand-written (`src/main.ts`,
 * `src/index.ts`), which is where a dead export is a real finding. Where the
 * framework owns the entry - a config file's `export default defineConfig(...)`,
 * a Next.js route's `export default function Page()`, its `metadata` - the
 * export exists because the framework reads it, and nothing in the project
 * imports it by design. knip 6.35 started applying `includeEntryExports` to
 * the files its own plugins register, so a blanket `true` failed the gate in
 * six of the eight templates with exports no project can remove.
 */
export type KnipFramework =
  | 'astro'
  | 'nestjs'
  | 'nextjs'
  | 'nuxt'
  | 'tanstack-start'
  | 'tauri'
  | 'ts-package'
  | 'vite-react'
  | 'vite-vue'

export const FRAMEWORK_ENTRIES: Record<
  KnipFramework,
  { entry: string[]; project: string[]; includeEntryExports: boolean }
> = {
  astro: {
    entry: ['src/pages/**/*.{astro,ts,tsx}', 'astro.config.*'],
    project: ['src/**/*.{astro,ts,tsx}'],
    includeEntryExports: false,
  },
  nestjs: {
    entry: ['src/main.ts', 'src/**/*.module.ts'],
    project: ['src/**/*.ts'],
    includeEntryExports: true,
  },
  // The App Router lives at either `app/` or `src/app/`, and the proxy follows
  // it. `{,src/}` matches both in one pattern, so neither layout produces a
  // "Refine entry pattern (no matches)" hint. Root-only entries silently
  // misread a `src/app` project: every route file falls outside the entry set
  // and knip reports the whole app as unused files while never checking a
  // single export. `next.config.*` stays root-only - Next.js requires it there.
  //
  // Every file convention belongs in the one brace alternation rather than in a
  // pattern of its own, including the metadata routes (`sitemap`, `robots`,
  // `manifest`, the image generators): a pattern matching nothing is a hint, and
  // no project uses all of them. `middleware` and `proxy` share a pattern for
  // the same reason - Next 16 renamed the file, and a project has one or the
  // other, never both.
  nextjs: {
    entry: [
      '{,src/}app/**/{page,layout,loading,error,global-error,not-found,route,template,default,sitemap,robots,manifest,icon,apple-icon,opengraph-image,twitter-image}.{ts,tsx}',
      'next.config.*',
      '{,src/}{middleware,proxy}.ts',
    ],
    project: ['{,src/}app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    includeEntryExports: false,
  },
  nuxt: {
    entry: ['app/**/*.vue', 'server/**/*.ts', 'nuxt.config.*'],
    project: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
    includeEntryExports: false,
  },
  // TanStack Start has no index.html and no src/main.tsx: the router is the
  // root of the graph and the framework generates routeTree.gen.ts from the
  // file-based routes. `src/{server,start,client}.{ts,tsx}` covers the
  // server entry across the versions that renamed it - a project has one or
  // two of them, and the brace alternation keeps the ones it lacks from
  // becoming "Refine entry pattern" hints.
  'tanstack-start': {
    entry: [
      'src/router.{ts,tsx}',
      'src/routes/**/*.{ts,tsx}',
      'src/{server,start,client}.{ts,tsx}',
      'vite.config.*',
    ],
    project: ['src/**/*.{ts,tsx}'],
    includeEntryExports: false,
  },
  tauri: {
    // The scaffolded tauri-app frontend is React, so its entry is
    // src/main.tsx, not src/main.ts; keep both extensions so a plain-TS
    // Tauri frontend also matches.
    entry: ['src/main.{ts,tsx}', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
    includeEntryExports: false,
  },
  'ts-package': {
    entry: ['src/index.ts'],
    project: ['src/**/*.ts'],
    includeEntryExports: true,
  },
  'vite-react': {
    entry: ['src/main.tsx', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
    includeEntryExports: false,
  },
  'vite-vue': {
    entry: ['src/main.ts', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,vue}'],
    includeEntryExports: false,
  },
}
