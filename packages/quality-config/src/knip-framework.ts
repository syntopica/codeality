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
  nextjs: {
    entry: [
      'app/**/{page,layout,loading,error,not-found,route,template,default}.{ts,tsx}',
      'next.config.*',
      'middleware.ts',
    ],
    project: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
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
    // src/main.ts imports the composition root via the '@/app' alias, which
    // resolves to the directory's index.ts. Knip's resolver does not follow
    // that implicit directory-index hop through a path alias, so without an
    // explicit entry here it treats everything main.ts reaches only through
    // '@/app' (createVueApp, the router, App.vue) as unreached dead code.
    entry: ['src/main.ts', 'index.html', 'vite.config.*', 'src/app/index.ts'],
    project: ['src/**/*.{ts,vue}'],
  },
}
