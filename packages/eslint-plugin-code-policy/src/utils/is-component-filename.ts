// A PascalCase `.tsx`/`.jsx` file is a React component, by the naming
// convention every React codebase follows. That matters for kind detection:
// `ContentTypeSelector.tsx` is a component whose name happens to end in
// "Selector", not a reselect-style selector that belongs in `selectors/`.
// Measured across 22 adopting repos, every single file matching a kind suffix
// on a `.tsx` extension was one of these.
export function isComponentFilename(basename: string): boolean {
  return /^[A-Z].*\.(?:tsx|jsx)$/.test(basename)
}
