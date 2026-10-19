import '../model/finding.dart';
import '../model/rule_code.dart';
import 'suppression.dart';

/// Whether a suppression covers [finding]. A parse failure never is: a file
/// that does not parse was not checked.
bool isSuppressed(Finding finding, List<Suppression> suppressions) =>
    finding.code != RuleCode.bdt000 &&
    suppressions.any(
      (s) =>
          s.code == finding.code.code &&
          (s.line == null || s.line == finding.location.line),
    );
