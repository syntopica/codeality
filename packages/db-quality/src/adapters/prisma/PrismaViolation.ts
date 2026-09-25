export type PrismaViolation = {
  ruleName: string
  message: string
  fileName: string
  location: { startLine: number }
}
