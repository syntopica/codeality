/// The result of running an external tool; [missing] when it is not
/// installed.
public struct ToolRun: Sendable {
  public let command: String
  public let exitCode: Int32
  public let stdout: String
  public let stderr: String
  public var missing = false
}
