import '../config/load_config.dart';
import '../engine/check_project.dart';
import '../gate/analyze_stage.dart';
import '../gate/duplicates_stage.dart';
import '../gate/stage_status.dart';
import 'baseline_file.dart';
import 'gate_finding_counts.dart';
import 'infrastructure_error.dart';
import 'structure_counts.dart';

/// Record the current debt of each named section into [baseline].
Future<BaselineFile> recordSections(
  String projectRoot,
  BaselineFile baseline,
  List<String> sections,
) async {
  var result = baseline;
  if (sections.contains('structure')) {
    final check = checkProject(projectRoot, loadConfig(projectRoot));
    result = result.withSection('structure', structureCounts(check.findings));
  }
  if (sections.contains('analyzer')) {
    final stage = await analyzeStage(projectRoot, null);
    if (stage.status == StageStatus.failedToRun) {
      throw InfrastructureError('${stage.command}: ${stage.detail}');
    }
    result = result.withSection('analyzer', gateFindingCounts(stage.findings));
  }
  if (sections.contains('duplicates')) {
    final stage = await duplicatesStage(
      projectRoot,
      loadConfig(projectRoot),
      null,
    );
    if (stage.status == StageStatus.failedToRun) {
      throw InfrastructureError('${stage.command}: ${stage.detail}');
    }
    result = result.withSection(
      'duplicates',
      gateFindingCounts(stage.findings),
    );
  }
  return result;
}
