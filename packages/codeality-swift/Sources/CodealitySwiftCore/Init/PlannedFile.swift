/// A path init would create, merge into, or leave alone. [content] is what
/// apply writes: for a conflict, what `--force` would write.
public struct PlannedFile: Sendable {
  public let path: String
  public let disposition: PlanDisposition
  public let detail: String
  public var content: String? = nil
}
