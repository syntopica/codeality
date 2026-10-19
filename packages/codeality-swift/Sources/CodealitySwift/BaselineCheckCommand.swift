import ArgumentParser
import CodealitySwiftCore

/// `baseline check`: fail only on findings beyond the recorded debt.
struct BaselineCheckCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "check", abstract: "Report new, known and resolved findings.")

  @OptionGroup var options: ProjectOptions

  func run() async throws {
    let root = options.root
    let baseline = try readBaseline(projectRoot: root) ?? BaselineFile(sections: [:])
    let result = try checkProject(projectRoot: root, config: try loadConfig(projectRoot: root))
    let classified = classifyFingerprints(
      result.findings.map(\.fingerprint), baseline.section("structure"))
    for (finding, state) in zip(result.findings, classified.states) where state == "new" {
      print(renderFindingLine(finding))
    }
    print(
      "\(classified.newCount) new, \(classified.knownCount) known, \(classified.resolvedCount) resolved"
    )
    try finish(with: classified.newCount == 0 ? .ok : .findings)
  }
}
