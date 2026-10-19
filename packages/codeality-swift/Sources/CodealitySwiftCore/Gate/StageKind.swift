/// Whether a stage that cannot run fails the gate (required) or is skipped
/// (optional).
public enum StageKind: String, Sendable {
    case required
    case optional
}
