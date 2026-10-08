// Removes the database URL and its password, raw and percent-decoded, from
// text that is about to reach the terminal, so a tool that echoes either
// does not leak the credential.
export const redactedDbUrl = (text: string, dbUrl: string): string => {
  const password = URL.canParse(dbUrl) ? new URL(dbUrl).password : ''
  const secrets = [dbUrl, password, decodeURIComponent(password)]
    .filter((secret) => secret !== '')
    .sort((a, b) => b.length - a.length)
  return secrets.reduce(
    (redacted, secret) => redacted.replaceAll(secret, '<redacted>'),
    text,
  )
}
