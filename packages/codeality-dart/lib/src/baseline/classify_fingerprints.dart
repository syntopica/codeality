import 'classified_fingerprints.dart';

/// Compare [current] against the [recorded] multiset: for each fingerprint
/// the first `recorded[fp]` occurrences are known, the rest new. A set would
/// hide a second copy of an already-recorded violation.
ClassifiedFingerprints classifyFingerprints(
  List<String> current,
  Map<String, int> recorded,
) {
  final remaining = Map<String, int>.of(recorded);
  final states = [
    for (final fingerprint in current)
      if ((remaining[fingerprint] ?? 0) > 0)
        (() {
          remaining[fingerprint] = remaining[fingerprint]! - 1;
          return 'known';
        })()
      else
        'new',
  ];
  final known = states.where((state) => state == 'known').length;
  return ClassifiedFingerprints(
    states: states,
    newCount: states.length - known,
    knownCount: known,
    resolvedCount: remaining.values.fold(0, (sum, count) => sum + count),
  );
}
