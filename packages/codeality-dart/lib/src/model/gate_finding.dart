import 'location.dart';

/// A finding reported by a gate stage other than the structural rules: an
/// analyzer diagnostic, a duplicated block.
final class GateFinding {
  const GateFinding({
    required this.code,
    required this.message,
    required this.location,
    this.fingerprint = '',
    this.baselineState = 'new',
  });

  final String code;
  final String message;
  final Location location;
  final String fingerprint;
  final String baselineState;

  GateFinding withBaseline(String fingerprint, String baselineState) =>
      GateFinding(
        code: code,
        message: message,
        location: location,
        fingerprint: fingerprint,
        baselineState: baselineState,
      );
}
