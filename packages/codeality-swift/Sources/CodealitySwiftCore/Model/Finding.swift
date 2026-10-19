/// One structural rule violation.
public struct Finding: Equatable, Sendable {
  public let code: RuleCode
  public let message: String
  public let location: Location

  public init(code: RuleCode, message: String, location: Location) {
    self.code = code
    self.message = message
    self.location = location
  }
}
