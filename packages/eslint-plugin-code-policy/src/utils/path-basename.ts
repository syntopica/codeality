// The last segment of a file path, for either separator. Rules decide
// exemptions on the file's own name; matching a suffix of the whole path let
// `reindex.js` pass as `index.js` and `myproxy.ts` as `proxy.ts`.
export function pathBasename(filename: string): string {
  return filename.slice(
    Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\')) + 1,
  )
}
