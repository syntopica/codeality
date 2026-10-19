/// A required tool is missing or crashed: exit 3.
public struct InfrastructureError: Error, CustomStringConvertible {
    public let message: String

    public init(_ message: String) { self.message = message }

    public var description: String { message }
}
