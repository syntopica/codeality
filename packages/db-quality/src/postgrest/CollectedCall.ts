import type ts from 'typescript'

import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'

export type CollectedCall = PostgrestCall & { node: ts.CallExpression }
