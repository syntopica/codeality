import '../gate/stage_result.dart';
import 'gate_finding_document.dart';

/// The JSON shape of one stage.
Map<String, Object?> stageDocument(StageResult stage) => {
  'name': stage.name,
  'kind': stage.kind.name,
  'command': stage.command,
  'duration_ms': stage.duration.inMilliseconds,
  'status': stage.status.name,
  'exit_code': stage.exitCode,
  'detail': stage.detail,
  'new': stage.newCount,
  'known': stage.knownCount,
  'resolved': stage.resolvedCount,
  'findings': stage.findings.map(gateFindingDocument).toList(),
};
