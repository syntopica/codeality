import '../model/finding.dart';

/// The multiset of fingerprints in [findings].
Map<String, int> structureCounts(List<Finding> findings) {
  final counts = <String, int>{};
  for (final finding in findings) {
    counts.update(finding.fingerprint, (n) => n + 1, ifAbsent: () => 1);
  }
  return counts;
}
