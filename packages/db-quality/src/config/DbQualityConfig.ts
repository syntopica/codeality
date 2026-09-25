export type DbQualityConfig = {
  schemaVersion: 1
  supabase?: { migrations: string }
  prisma?: { schema: string }
  drizzle?: { roots: string[]; objectNames: string[] }
  sqlite?: { files: string[] }
  audit: { inGate: boolean; bloatThreshold: number; soda?: string }
  disable: string[]
}
