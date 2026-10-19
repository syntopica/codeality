/// Each current fingerprint's state, aligned with the input, plus counts.
public struct ClassifiedFingerprints: Equatable, Sendable {
    /// `new` or `known` for each input fingerprint, in input order.
    public let states: [String]
    public let newCount: Int
    public let knownCount: Int
    public let resolvedCount: Int
}
