import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;

import '../config/config_error.dart';
import 'baseline_file.dart';

/// The project's recorded debt, or null when none is recorded.
BaselineFile? readBaseline(String projectRoot) {
  final file = File(p.join(projectRoot, BaselineFile.fileName));
  if (!file.existsSync()) return null;
  final Object? document;
  try {
    document = jsonDecode(file.readAsStringSync());
  } on FormatException catch (error) {
    throw ConfigError(
      '${BaselineFile.fileName} is not valid JSON: ${error.message}',
    );
  }
  if (document is! Map<String, Object?>) {
    throw ConfigError('${BaselineFile.fileName} must be a JSON object');
  }
  final version = document['schema_version'];
  if (version != BaselineFile.currentSchemaVersion) {
    throw ConfigError(
      '${BaselineFile.fileName} has schema_version $version; this release '
      'reads schema_version ${BaselineFile.currentSchemaVersion}',
    );
  }
  final sections = document['sections'];
  if (sections is! Map<String, Object?>) {
    throw ConfigError('${BaselineFile.fileName} has no "sections" object');
  }
  return BaselineFile(
    toolVersion: document['tool_version'] as String? ?? '',
    sections: {
      for (final MapEntry(:key, :value) in sections.entries)
        key: (value! as Map<String, Object?>).cast<String, int>(),
    },
  );
}
