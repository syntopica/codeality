/** Which kysely-codegen dialect a database URL needs, or undefined when none does. */
export const codegenDialectOf = (
  url: string,
): 'postgres' | 'mysql' | undefined => {
  let scheme: string
  try {
    scheme = new URL(url).protocol
  } catch {
    return undefined
  }
  if (scheme === 'postgres:' || scheme === 'postgresql:') return 'postgres'
  if (scheme === 'mysql:') return 'mysql'
  return undefined
}
