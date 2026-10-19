import 'dart:io';

import 'package:path/path.dart' as p;

import '../gate/is_flutter_project.dart';
import 'plan_analysis_options.dart';
import 'plan_caller_workflow.dart';
import 'plan_ci_workflow.dart';
import 'plan_dart_config.dart';
import 'plan_pubspec.dart';
import 'planned_file.dart';
import 'project_job_id.dart';
import 'render_dart_job.dart';
import 'repository_root.dart';

/// Everything init would do. It reads; it never writes. [sdkVersion] is the
/// Flutter version (Flutter projects) or Dart SDK version the CI job pins.
List<PlannedFile> planInit(
  String projectRoot, {
  required bool ci,
  required String profile,
  required String sdkVersion,
}) {
  final planned = [
    planAnalysisOptions(projectRoot),
    planPubspec(projectRoot),
    planDartConfig(projectRoot, profile),
  ];
  if (!ci) return planned;
  // git reports the resolved path; macOS temp and home paths are symlinks.
  final resolved = Directory(projectRoot).resolveSymbolicLinksSync();
  final repoRoot = repositoryRoot(resolved);
  final jobId = projectJobId(repoRoot, resolved);
  final relative = p.relative(resolved, from: repoRoot);
  final jobText = renderDartJob(
    jobId: jobId,
    workingDirectory: relative,
    flutter: isFlutterProject(projectRoot),
    sdkVersion: sdkVersion,
  );
  return [
    ...planned,
    planCiWorkflow(repoRoot, jobId, jobText),
    ?planCallerWorkflow(repoRoot),
  ];
}
