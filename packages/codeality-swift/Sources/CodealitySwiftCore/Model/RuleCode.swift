/// The structural rules, by code.
public enum RuleCode: String, CaseIterable, Sendable {
    case bsw000 = "parse-error"
    case bsw001 = "one-primary-unit"
    case bsw002 = "file-matches-unit"
    case bsw003 = "no-grab-bag-names"
    case bsw004 = "max-file-lines"
    case bsw005 = "no-inline-sql"

    /// `BSW000` and so on.
    public var code: String { String(describing: self).uppercased() }

    /// `parse-error` and so on.
    public var slug: String { rawValue }
}
