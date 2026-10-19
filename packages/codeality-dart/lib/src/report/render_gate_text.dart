import '../gate/gate_result.dart';
import 'render_stage_text.dart';

const Map<int, String> _verdicts = {
  0: 'passed',
  1: 'findings',
  3: 'failed to run',
};

/// The terminal report: every stage, then the verdict.
String renderGateText(GateResult result) => [
  for (final stage in result.stages) ...renderStageText(stage),
  'gate: ${_verdicts[result.exitCode]} (exit ${result.exitCode})',
].join('\n');
