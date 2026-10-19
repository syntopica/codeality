import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:yaml/yaml.dart';
import 'package:yaml_edit/yaml_edit.dart';

import 'codeality_lints_constraint.dart';
import 'plan_disposition.dart';
import 'planned_file.dart';
import 'superseded_lint_packages.dart';

/// Add codeality_lints to `dev_dependencies` and drop the lint packages it
/// supersedes. An existing codeality_lints entry, whatever its source, is
/// left alone.
PlannedFile planPubspec(String projectRoot) {
  final path = p.join(projectRoot, 'pubspec.yaml');
  final text = File(path).readAsStringSync();
  final document = loadYaml(text);
  final dev = document is YamlMap ? document['dev_dependencies'] : null;
  if (dev is YamlMap && dev.containsKey('codeality_lints')) {
    return PlannedFile(path, PlanDisposition.unchanged, 'already depends');
  }
  final editor = YamlEditor(text);
  final removed = <String>[];
  if (dev is YamlMap) {
    // Add before removing: emptying a block map turns it into flow style.
    editor.update([
      'dev_dependencies',
      'codeality_lints',
    ], codealityLintsConstraint);
    for (final package in supersededLintPackages) {
      if (!dev.containsKey(package)) continue;
      editor.remove(['dev_dependencies', package]);
      removed.add(package);
    }
  } else {
    editor.update(
      ['dev_dependencies'],
      {'codeality_lints': codealityLintsConstraint},
    );
  }
  return PlannedFile(
    path,
    PlanDisposition.merge,
    [
      'add codeality_lints $codealityLintsConstraint',
      if (removed.isNotEmpty) 'remove ${removed.join(', ')}',
      'run pub get',
    ].join('; '),
    editor.toString(),
  );
}
