import '../gate/gate_result.dart';
import 'gate_verdicts.dart';
import 'render_stage_text.dart';

/// The terminal report: every stage, then the verdict.
String renderGateText(GateResult result) => [
  for (final stage in result.stages) ...renderStageText(stage),
  'gate: ${gateVerdicts[result.exitCode]} (exit ${result.exitCode})',
].join('\n');
