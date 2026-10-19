import 'stage_result.dart';

/// One runnable stage of the gate.
typedef GateStage = Future<StageResult> Function();
