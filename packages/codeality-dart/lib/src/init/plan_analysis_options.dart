import 'dart:io';

import 'package:path/path.dart' as p;

import '../gate/is_flutter_project.dart';
import 'fresh_analysis_options.dart';
import 'merge_analysis_options.dart';
import 'plan_disposition.dart';
import 'planned_file.dart';

/// Point `analysis_options.yaml` at codeality_lints, merging into an
/// existing file rather than replacing it.
PlannedFile planAnalysisOptions(String projectRoot) {
  final path = p.join(projectRoot, 'analysis_options.yaml');
  final flutter = isFlutterProject(projectRoot);
  final fresh = freshAnalysisOptions(flutter: flutter);
  final file = File(path);
  if (!file.existsSync()) {
    return PlannedFile(path, PlanDisposition.create, 'not present', fresh);
  }
  final merged = mergeAnalysisOptions(
    file.readAsStringSync(),
    flutter: flutter,
  );
  if (merged == null) {
    return PlannedFile(
      path,
      PlanDisposition.conflict,
      'include is a list without the codeality set; use --force to replace',
      fresh,
    );
  }
  final (text, changes) = merged;
  if (changes.isEmpty) {
    return PlannedFile(path, PlanDisposition.unchanged, 'already current');
  }
  return PlannedFile(path, PlanDisposition.merge, changes.join('; '), text);
}
