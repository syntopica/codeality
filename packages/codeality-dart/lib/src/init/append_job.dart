import 'package:collection/collection.dart';
import 'package:yaml/yaml.dart';
import 'package:yaml_edit/yaml_edit.dart';

import 'parse_job.dart';

/// Add [jobText] (job [jobId]) to a workflow. Appending the text keeps its
/// comments; when `jobs:` is not the last key that is wrong, so the job is
/// set through the YAML editor instead.
String appendJob(String workflow, String jobId, String jobText) {
  final job = parseJob(jobId, jobText);
  final appended =
      '${workflow.endsWith('\n') ? workflow : '$workflow\n'}$jobText';
  try {
    final jobs = (loadYaml(appended) as YamlMap)['jobs'];
    if (jobs is YamlMap &&
        const DeepCollectionEquality().equals(jobs[jobId], job)) {
      return appended;
    }
  } on YamlException {
    // Not appendable as text; fall through to the editor.
  }
  return (YamlEditor(workflow)..update(['jobs', jobId], job)).toString();
}
