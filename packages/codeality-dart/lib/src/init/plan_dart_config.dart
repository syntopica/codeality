import 'dart:io';

import 'package:path/path.dart' as p;

import 'fresh_dart_config.dart';
import 'plan_disposition.dart';
import 'planned_file.dart';

/// Write `codeality-dart.yaml` once. An existing one holds the project's own
/// thresholds and is never replaced, even by `--force`.
PlannedFile planDartConfig(String projectRoot, String profile) {
  final path = p.join(projectRoot, 'codeality-dart.yaml');
  if (File(path).existsSync()) {
    return PlannedFile(path, PlanDisposition.unchanged, 'present; left as is');
  }
  return PlannedFile(
    path,
    PlanDisposition.create,
    'not present',
    freshDartConfig(profile),
  );
}
