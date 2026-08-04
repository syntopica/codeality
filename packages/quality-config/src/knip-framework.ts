/** Entry and project globs per template framework, consumed by createKnipConfig. */
export type KnipFramework =
  | 'astro'
  | 'nestjs'
  | 'nextjs'
  | 'nuxt'
  | 'tauri'
  | 'ts-package'
  | 'vite-react'
  | 'vite-vue'

export const FRAMEWORK_ENTRIES: Record<
  KnipFramework,
  { entry: string[]; project: string[] }
> = {
  astro: {
    entry: ['src/pages/**/*.{astro,ts,tsx}', 'astro.config.*'],
    project: ['src/**/*.{astro,ts,tsx}'],
  },
  nestjs: {
    entry: ['src/main.ts', 'src/**/*.module.ts'],
    project: ['src/**/*.ts'],
  },
  // The App Router lives at either `app/` or `src/app/`, and `middleware`
  // follows it. `{,src/}` matches both in one pattern, so neither layout
  // produces a "Refine entry pattern (no matches)" hint. Root-only entries
  // silently misread a `src/app` project: every route file falls outside the
  // entry set and knip reports the whole app as unused files while never
  // checking a single export. `next.config.*` stays root-only - Next.js
  // requires it there.
  nextjs: {
    entry: [
      '{,src/}app/**/{page,layout,loading,error,not-found,route,template,default}.{ts,tsx}',
      'next.config.*',
      '{,src/}middleware.ts',
    ],
    project: ['{,src/}app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  },
  nuxt: {
    entry: ['app/**/*.vue', 'server/**/*.ts', 'nuxt.config.*'],
    project: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
  },
  tauri: {
    // The scaffolded tauri-app frontend is React, so its entry is
    // src/main.tsx, not src/main.ts; keep both extensions so a plain-TS
    // Tauri frontend also matches.
    entry: ['src/main.{ts,tsx}', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
  },
  'ts-package': {
    entry: ['src/index.ts'],
    project: ['src/**/*.ts'],
  },
  'vite-react': {
    entry: ['src/main.tsx', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
  },
  'vite-vue': {
    entry: ['src/main.ts', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,vue}'],
  },
}
