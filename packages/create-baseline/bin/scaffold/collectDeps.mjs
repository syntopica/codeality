/**
 * A manifest's runtime and development dependencies as one map.
 *
 * Which of the two a baseline package sits in is not something this tool has
 * an opinion about, and several adopters put `@busirocket/tsconfig` in
 * `dependencies` because their build reads it.
 */
export function collectDeps(manifest) {
  return { ...manifest.dependencies, ...manifest.devDependencies }
}
