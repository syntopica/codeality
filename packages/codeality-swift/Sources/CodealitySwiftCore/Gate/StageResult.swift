/// The outcome of one gate stage.
public struct StageResult: Sendable {
  public let name: String
  public let kind: StageKind
  public let command: String
  public let status: StageStatus
  public var exitCode: Int32? = nil
  public var seconds: Double = 0
  public var detail: String = ""
  public var findings: [GateFinding] = []
  public var newCount = 0
  public var knownCount = 0
  public var resolvedCount = 0
}
