import '../model/gate_finding.dart';

/// The JSON shape of one gate finding.
Map<String, Object?> gateFindingDocument(GateFinding finding) => {
  'code': finding.code,
  'message': finding.message,
  'path': finding.location.path,
  'line': finding.location.line,
  'column': finding.location.column,
  'baseline_state': finding.baselineState,
  'fingerprint': finding.fingerprint,
};
