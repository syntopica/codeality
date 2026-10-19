import '../baseline/baseline_file.dart';
import '../config/dart_config.dart';
import 'analyze_stage.dart';
import 'audit_stage.dart';
import 'duplicates_stage.dart';
import 'format_stage.dart';
import 'gate_stage.dart';
import 'structure_stage.dart';
import 'test_stage.dart';

/// The spec's stage order: format, analyze, structure, duplicates, test,
/// audit.
List<GateStage> defaultGateStages(
  String projectRoot,
  DartConfig config,
  BaselineFile? baseline,
) => [
  () => formatStage(projectRoot, config),
  () => analyzeStage(projectRoot, baseline),
  () => structureStage(projectRoot, config, baseline),
  () => duplicatesStage(projectRoot, config, baseline),
  () => testStage(projectRoot, config),
  () => auditStage(projectRoot),
];
