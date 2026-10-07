/** The migration's name as a file name: anything but letters, digits, `.`, `_` and `-` becomes `_`. */
export const scratchFileName = (name: string): string =>
  `${name.replaceAll(/[^\w.-]/g, '_')}.sql`
