/// A configuration problem: exit 2.
public struct ConfigError: Error, Equatable, CustomStringConvertible {
    public let message: String

    public init(_ message: String) { self.message = message }

    public var description: String { message }
}
