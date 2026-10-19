/// Each current fingerprint's state, aligned with the input, plus counts.
final class ClassifiedFingerprints {
  const ClassifiedFingerprints({
    required this.states,
    required this.newCount,
    required this.knownCount,
    required this.resolvedCount,
  });

  /// `new` or `known` for each input fingerprint, in input order.
  final List<String> states;
  final int newCount;
  final int knownCount;
  final int resolvedCount;
}
