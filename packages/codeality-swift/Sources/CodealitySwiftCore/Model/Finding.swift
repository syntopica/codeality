/// One structural rule violation. [subject] is what the finding is about
/// (a name, a count) when its line alone would not identify it.
public struct Finding: Equatable, Sendable {
  public let code: RuleCode
  public let message: String
  public let location: Location
  public let subject: String?

  public init(code: RuleCode, message: String, location: Location, subject: String? = nil) {
    self.code = code
    self.message = message
    self.location = location
    self.subject = subject
  }
}
