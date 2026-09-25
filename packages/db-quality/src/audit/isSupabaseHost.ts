/** Whether a database URL points at a Supabase project, where advisors and inspect can answer. */
export const isSupabaseHost = (dbUrl: string): boolean => {
  try {
    const { hostname } = new URL(dbUrl)
    return (
      hostname.endsWith('.supabase.co') ||
      hostname.endsWith('.pooler.supabase.com')
    )
  } catch {
    return false
  }
}
