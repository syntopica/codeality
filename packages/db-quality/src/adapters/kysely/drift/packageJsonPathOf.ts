// Builds the path to the project's package.json, used so `loadTypeScript`
// can resolve the project's own installed `typescript` package.
export const packageJsonPathOf = (root: string): string =>
  `${root}/package.json`
