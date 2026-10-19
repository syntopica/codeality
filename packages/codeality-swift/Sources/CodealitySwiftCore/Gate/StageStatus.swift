/// How one gate stage ended.
public enum StageStatus: String, Sendable {
    case passed
    case findings
    case failedToRun
    case skippedNotApplicable
}
