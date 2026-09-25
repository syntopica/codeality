import type ts from 'typescript'

/** The compiler API, loaded at run time only when the PostgREST rules run. */
export type TypeScriptModule = typeof ts
