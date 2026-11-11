/**
 * Whether two addresses name the same document. An exact pathname match: a
 * suffix match took `loginPath: "/"` for every address ending in a slash.
 */
export const samePathname = (address: string, other: string): boolean =>
  new URL(address).pathname === new URL(other).pathname
