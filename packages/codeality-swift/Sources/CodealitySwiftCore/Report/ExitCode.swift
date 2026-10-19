/// The process exit codes every command returns.
public enum ExitCode: Int32, Sendable {
    case ok = 0
    case findings = 1
    case configuration = 2
    case infrastructure = 3
}
