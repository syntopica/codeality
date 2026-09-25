import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'

export type PostgrestChain = {
  path: string
  line: number
  root: 'from' | 'rpc'
  target: string
  calls: PostgrestCall[]
  inLoop: boolean
  text: string
}
