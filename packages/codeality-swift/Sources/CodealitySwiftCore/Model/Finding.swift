/// One structural rule violation. [subject] is what the finding is about
/// (a name, a count) when its line alone would not identify it.
public struct Finding: Equatable, Sendable {
  public let code: RuleCode
  public let message: String
  public let location: Location
  public let subject: String?
  public let fingerprint: String
  public let baselineState: String?

  public init(
    code: RuleCode, message: String, location: Location, subject: String? = nil,
    fingerprint: String = "", baselineState: String? = nil
  ) {
    self.code = code
    self.message = message
    self.location = location
    self.subject = subject
    self.fingerprint = fingerprint
    self.baselineState = baselineState
  }

  /// This finding with its baseline identity and state.
  public func withBaseline(_ fingerprint: String, _ state: String) -> Finding {
    Finding(
      code: code, message: message, location: location, subject: subject,
      fingerprint: fingerprint, baselineState: state)
  }
}
