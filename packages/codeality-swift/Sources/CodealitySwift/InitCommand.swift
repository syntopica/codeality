import ArgumentParser
import CodealitySwiftCore

/// `codeality-swift init`: plan by default, write on request.
struct InitCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "init", abstract: "Write codeality config into a project.")

  @OptionGroup var options: ProjectOptions
  @Option(help: "A source root (repeatable; default Sources).") var root: [String] = []
  @Option(help: "A test root (repeatable; default Tests).") var testRoot: [String] = []
  @Option(help: "An entrypoint file or glob (repeatable).") var entrypoint: [String] = []
  @Flag(help: "Plan only; exit 2 on a conflict.") var check = false
  @Flag(help: "Write creates and merges.") var apply = false
  @Flag(help: "Also replace conflicts.") var force = false
  @Flag(help: "Also merge the CI job.") var ci = false

  func run() async throws {
    let projectRoot = options.root
    let plan = try planInit(
      projectRoot: projectRoot, ci: ci, roots: root.isEmpty ? ["Sources"] : root,
      testRoots: testRoot.isEmpty && root.isEmpty ? ["Tests"] : testRoot, entrypoints: entrypoint)
    for planned in plan {
      print("\(renderPlannedFile(planned, projectRoot: projectRoot))")
    }
    if apply || force { print("wrote \(try applyInit(plan, force: force).count) files") }
    let conflict = plan.contains { $0.disposition == .conflict }
    try finish(with: conflict && check ? .configuration : .ok)
  }
}
