export const normalizeSqlText = (text: string): string =>
  text.toLowerCase().replaceAll(/\s+/g, ' ').trim()
