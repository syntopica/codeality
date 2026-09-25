export type AdvisorEntry = {
  name: string
  title: string
  level: 'ERROR' | 'WARN' | 'INFO'
  detail: string
  metadata?: { name?: string; schema?: string; type?: string }
}
