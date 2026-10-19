import Foundation

/// Everything init would write for the project at [projectRoot]. Plans
/// only: nothing is written.
public func planInit(
  projectRoot: String, ci: Bool, roots: [String], testRoots: [String], entrypoints: [String]
) throws -> [PlannedFile] {
  let root = URL(fileURLWithPath: projectRoot).resolvingSymlinksInPath()
  var planned = [
    planSwiftConfig(
      root.appendingPathComponent(configFileName).path,
      codealitySwiftYaml(roots: roots, testRoots: testRoots, entrypoints: entrypoints)),
    planManagedFile(root.appendingPathComponent(".swift-format").path, swiftFormatConfig),
    planManagedFile(root.appendingPathComponent(".swiftlint.yml").path, swiftlintConfig),
  ]
  guard ci else { return planned }
  let repoRoot = URL(fileURLWithPath: repositoryRoot(root.path)).resolvingSymlinksInPath().path
  let relative = relativePath(root.path, to: repoRoot)
  let workingDirectory = relative == root.path || relative.isEmpty ? "." : relative
  planned.append(
    planCiWorkflow(repoRoot: repoRoot, jobText: renderSwiftJob(workingDirectory: workingDirectory)))
  if let caller = planCallerWorkflow(repoRoot: repoRoot) { planned.append(caller) }
  return planned
}
