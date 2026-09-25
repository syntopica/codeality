import type { TableKnowledge } from '@/rules/TableKnowledge.js'

/** What a PostgREST rule sees beyond the chain itself: the migrations' index knowledge. */
export type RuleContext = { knowledge: Map<string, TableKnowledge> }
