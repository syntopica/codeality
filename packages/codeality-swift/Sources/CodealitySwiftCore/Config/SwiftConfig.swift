/// The resolved `codeality-swift.yaml`.
public struct SwiftConfig: Sendable {
  public let schemaVersion: Int
  public let roots: [String]
  public let testRoots: [String]
  public let maxFileLines: Int
  public let testMaxFileLines: Int
  public let entrypoint: [String]
  public let generated: [String]
  public let exclude: [String]
  public let duplicatesMinTokens: Int?
  public let duplicatesThreshold: Double?
}
