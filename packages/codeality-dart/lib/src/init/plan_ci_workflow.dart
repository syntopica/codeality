import 'dart:io';

import 'package:collection/collection.dart';
import 'package:path/path.dart' as p;
import 'package:yaml/yaml.dart';
import 'package:yaml_edit/yaml_edit.dart';

import 'append_job.dart';
import 'codeality_workflow_header.dart';
import 'parse_job.dart';
import 'plan_disposition.dart';
import 'planned_file.dart';

/// Merge job [jobId] into the repository's root `codeality.yml`, leaving
/// every other job untouched.
PlannedFile planCiWorkflow(String repoRoot, String jobId, String jobText) {
  final path = p.join(repoRoot, '.github', 'workflows', 'codeality.yml');
  final file = File(path);
  if (!file.existsSync()) {
    return PlannedFile(
      path,
      PlanDisposition.create,
      'not present',
      '$codealityWorkflowHeader$jobText',
    );
  }
  final text = file.readAsStringSync();
  final document = loadYaml(text);
  final jobs = document is YamlMap ? document['jobs'] : null;
  final existing = jobs is YamlMap ? jobs[jobId] : null;
  if (existing == null) {
    return PlannedFile(
      path,
      PlanDisposition.merge,
      'add job $jobId',
      appendJob(text, jobId, jobText),
    );
  }
  final expected = parseJob(jobId, jobText);
  if (const DeepCollectionEquality().equals(existing, expected)) {
    return PlannedFile(path, PlanDisposition.unchanged, 'job $jobId current');
  }
  final without = (YamlEditor(text)..remove(['jobs', jobId])).toString();
  return PlannedFile(
    path,
    PlanDisposition.conflict,
    'job $jobId was edited; use --force to replace it',
    appendJob(without, jobId, jobText),
  );
}
