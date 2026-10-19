import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;

import '../version.dart';
import 'baseline_file.dart';

/// Write [baseline] with sorted keys so the file diffs cleanly.
void writeBaseline(String projectRoot, BaselineFile baseline) {
  final sections = {
    for (final name in baseline.sections.keys.toList()..sort())
      name: {
        for (final fingerprint
            in baseline.sections[name]!.keys.toList()..sort())
          fingerprint: baseline.sections[name]![fingerprint],
      },
  };
  final document = {
    'schema_version': baseline.schemaVersion,
    'tool_version': packageVersion,
    'sections': sections,
  };
  File(p.join(projectRoot, BaselineFile.fileName)).writeAsStringSync(
    '${const JsonEncoder.withIndent('  ').convert(document)}\n',
  );
}
