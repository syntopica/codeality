import 'location.dart';
import 'rule_code.dart';

/// One structural rule violation.
final class Finding {
  const Finding({
    required this.code,
    required this.message,
    required this.location,
    this.subject,
    this.fingerprint = '',
    this.baselineState = 'new',
  });

  final RuleCode code;
  final String message;
  final Location location;

  /// The thing that is wrong, when the rule names one (a symbol, a segment).
  final String? subject;
  final String fingerprint;
  final String baselineState;

  Finding withBaseline(String fingerprint, String baselineState) => Finding(
    code: code,
    message: message,
    location: location,
    subject: subject,
    fingerprint: fingerprint,
    baselineState: baselineState,
  );
}
