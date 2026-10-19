import 'dart:io';

import 'package:path/path.dart' as p;

import 'minimal_caller_workflow.dart';
import 'plan_disposition.dart';
import 'planned_file.dart';

/// A caller for `codeality.yml` when the repository has no CI; otherwise a
/// note on how to call it, or nothing when something already does.
PlannedFile? planCallerWorkflow(String repoRoot) {
  final directory = Directory(p.join(repoRoot, '.github', 'workflows'));
  final others = directory.existsSync()
      ? [
          for (final entity in directory.listSync())
            if (entity is File &&
                RegExp(r'\.ya?ml$').hasMatch(entity.path) &&
                p.basename(entity.path) != 'codeality.yml')
              entity,
        ]
      : <File>[];
  if (others.isEmpty) {
    return PlannedFile(
      p.join(directory.path, 'quality.yml'),
      PlanDisposition.create,
      'no CI workflow; calls codeality.yml on push and pull_request',
      minimalCallerWorkflow,
    );
  }
  if (others.any((file) => file.readAsStringSync().contains('codeality.yml'))) {
    return null;
  }
  return PlannedFile(
    directory.path,
    PlanDisposition.unchanged,
    'nothing calls codeality.yml yet; add a job to your CI with '
    '`uses: ./.github/workflows/codeality.yml`',
  );
}
