import type { PrismaViolation } from '@/adapters/prisma/PrismaViolation.js'

export type PrismaLintReport = { violations: PrismaViolation[] }
