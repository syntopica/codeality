/// The outcome of running the structural rules over a project.
public struct CheckResult: Sendable {
  public let roots: [String]
  public let scannedFiles: Int
  public let findings: [Finding]
  public let warnings: [String]
}
