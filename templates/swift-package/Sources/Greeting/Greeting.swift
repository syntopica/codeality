/// A greeting for one person.
public struct Greeting: Sendable {
    public let name: String

    public init(name: String) {
        self.name = name
    }

    /// The greeting text.
    public var text: String {
        "Hello, \(name)!"
    }
}
