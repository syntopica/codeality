export declare function withCruiseTsconfig<Result>(
  configPath: string,
  operation: (configPath: string) => Result,
  options?: { readonly requirePaths?: boolean },
): Result
