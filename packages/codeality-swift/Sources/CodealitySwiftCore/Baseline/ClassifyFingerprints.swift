/// Compare [current] against the [recorded] multiset: for each fingerprint
/// the first `recorded[fp]` occurrences are known, the rest new. A set would
/// hide a second copy of an already-recorded violation.
public func classifyFingerprints(_ current: [String], _ recorded: [String: Int])
  -> ClassifiedFingerprints
{
  var remaining = recorded
  let states = current.map { fingerprint -> String in
    guard let left = remaining[fingerprint], left > 0 else { return "new" }
    remaining[fingerprint] = left - 1
    return "known"
  }
  let known = states.filter { $0 == "known" }.count
  return ClassifiedFingerprints(
    states: states, newCount: states.count - known, knownCount: known,
    resolvedCount: remaining.values.reduce(0, +))
}
