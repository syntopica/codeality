/// The multiset of [fingerprints].
public func fingerprintCounts(_ fingerprints: [String]) -> [String: Int] {
  fingerprints.reduce(into: [:]) { counts, fingerprint in counts[fingerprint, default: 0] += 1 }
}
