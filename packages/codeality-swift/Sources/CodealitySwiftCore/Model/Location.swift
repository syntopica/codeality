/// A project-relative position, 1-based.
public struct Location: Equatable, Sendable {
    public let path: String
    public let line: Int
    public let column: Int

    public init(_ path: String, _ line: Int, _ column: Int) {
        self.path = path
        self.line = line
        self.column = column
    }
}
