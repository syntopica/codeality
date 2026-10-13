// POSIX single quoting: nothing inside single quotes is special except the
// quote itself, which closes the string, is emitted escaped, and reopens it.
// Routes can come from a site's sitemap, so they are untrusted text.
export const shellQuoted = (value: string): string =>
  `'${value.replaceAll("'", String.raw`'\''`)}'`
