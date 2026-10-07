import type ts from 'typescript'

/** What typescript-eslint's parser exposes once a file is parsed with type information. */
export type TypedParserServices = {
  program: ts.Program | null
  esTreeNodeToTSNodeMap?: { get: (node: unknown) => ts.Node }
}
