/// A finding from a gate stage other than the structural rules: a format
/// or swiftlint diagnostic, a duplicated block.
public struct GateFinding: Equatable, Sendable {
  public let code: String
  public let message: String
  public let location: Location
  public let fingerprint: String
  public let baselineState: String

  public init(
    code: String, message: String, location: Location, fingerprint: String = "",
    baselineState: String = "new"
  ) {
    self.code = code
    self.message = message
    self.location = location
    self.fingerprint = fingerprint
    self.baselineState = baselineState
  }

  public func withBaseline(_ state: String) -> GateFinding {
    GateFinding(
      code: code, message: message, location: location, fingerprint: fingerprint,
      baselineState: state)
  }
}
