/// One top-level declaration of a source file.
public struct Unit: Equatable, Sendable {
  public let name: String
  public let kind: UnitKind
  public let line: Int
  /// Marked `@main`.
  public let isMain: Bool
}
