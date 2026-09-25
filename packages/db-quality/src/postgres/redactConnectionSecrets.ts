/** Replaces the password in any `scheme://user:password@host` occurrence with `***`, so a connection string psql echoes back in an error never carries a real credential. */
export const redactConnectionSecrets = (text: string): string =>
  text.replace(/(\w+:\/\/[^:/\s@]+:)[^@\s]+@/g, '$1***@')
