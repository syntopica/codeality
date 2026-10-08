import type ts from 'typescript'

/** The project's parsed tsconfig compiler options, minus incremental-build fields unsafe to reuse. */
export type TsConfigCompilerOptions = ts.CompilerOptions
