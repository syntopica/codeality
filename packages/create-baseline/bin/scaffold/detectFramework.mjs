// The knip preset key for a project, read from its dependencies.
//
// Order matters: a Tauri app also carries vite and react, a Nuxt app also
// carries vue, and a TanStack Start app carries both react and vite while
// having neither index.html nor src/main.tsx - so the most specific marker has
// to win. `ts-package` is the fallback because a library has none of these
// markers at all.
export function detectFramework(deps) {
  if (deps['@tauri-apps/api'] || deps['@tauri-apps/cli']) return 'tauri'
  if (deps['nuxt']) return 'nuxt'
  if (deps['astro']) return 'astro'
  if (deps['@nestjs/core']) return 'nestjs'
  if (deps['next']) return 'nextjs'
  if (deps['@tanstack/react-start']) return 'tanstack-start'
  if (deps['vue']) return 'vite-vue'
  if (deps['react']) return 'vite-react'
  return 'ts-package'
}
