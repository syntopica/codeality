export type DevDependencyGraph = {
  modules: {
    source: string
    dependencies: {
      module: string
      resolved: string
      couldNotResolve: boolean
      dependencyTypes: string[]
    }[]
  }[]
  summary: {
    violations: {
      from: string
      to: string
      rule: { name: string; severity: string }
    }[]
  }
}
