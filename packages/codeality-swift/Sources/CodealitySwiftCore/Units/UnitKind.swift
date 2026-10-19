/// What a top-level unit is.
public enum UnitKind: Sendable {
  /// A counted declaration: type, function, variable, typealias, macro.
  case declaration
  /// An extension; the unit's name is the extended type.
  case `extension`
  /// A `#Preview` or a `PreviewProvider` conformer.
  case preview
}
