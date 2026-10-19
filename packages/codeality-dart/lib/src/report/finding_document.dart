import '../model/finding.dart';

/// The frozen JSON shape of one finding.
Map<String, Object?> findingDocument(Finding finding) => {
  'code': finding.code.code,
  'slug': finding.code.slug,
  'message': finding.message,
  'path': finding.location.path,
  'line': finding.location.line,
  'column': finding.location.column,
  'subject': finding.subject,
  'baseline_state': finding.baselineState,
  'fingerprint': finding.fingerprint,
};
