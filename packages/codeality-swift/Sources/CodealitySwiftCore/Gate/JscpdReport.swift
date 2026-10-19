/// The clones jscpd found and the duplicated share of the scanned lines.
public struct JscpdReport: Sendable {
    public let clones: [GateFinding]
    public let percentage: Double
}
