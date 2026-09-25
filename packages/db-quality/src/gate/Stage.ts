import type { Finding } from '@/model/Finding.js'

export type Stage = { name: string; run: () => Finding[] | 'not-applicable' }
