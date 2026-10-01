/** Rules whose result depends on the colour scheme; only these fingerprint it. */
export const isColorDependent = (rule: string): boolean =>
  rule === 'palette' || rule.startsWith('a11y/')
