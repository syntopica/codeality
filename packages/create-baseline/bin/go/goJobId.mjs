/**
 * The id of the job `codeality-go init --ci` writes for the module in
 * `workingDirectory`, relative to the repository root: `go` at the root,
 * `go-<path>` below it.
 */
export function goJobId(workingDirectory) {
  if (!workingDirectory || workingDirectory === '.') return 'go'
  return `go-${workingDirectory.replaceAll(/\W/g, '-')}`
}
