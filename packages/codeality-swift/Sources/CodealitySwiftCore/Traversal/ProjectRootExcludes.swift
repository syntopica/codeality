/// Directory names skipped only directly under the project root, where they
/// hold build output; deeper down they are ordinary source folders.
let projectRootExcludes: Set<String> = ["build"]
