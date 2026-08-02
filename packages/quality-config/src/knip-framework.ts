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
    entry: ['src/main.ts', 'vite.config.*'],
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
