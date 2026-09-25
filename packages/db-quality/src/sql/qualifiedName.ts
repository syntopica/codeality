export const qualifiedName = (raw: string): string => {
  const parts = raw
    .trim()
    .split('.')
    .map((part) => part.replaceAll('"', '').toLowerCase())
  return parts.length === 1 ? `public.${parts[0] ?? ''}` : parts.join('.')
}
