/// A comment silencing one rule, on one line or (when [line] is nil) in the
/// whole file.
struct Suppression: Equatable {
    let code: String
    let line: Int?
}
