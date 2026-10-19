import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:yaml/yaml.dart';

import 'config_error.dart';
import 'config_reader.dart';
import 'dart_config.dart';
import 'reject_duplicate_role_claims.dart';
import 'reject_unknown_keys.dart';

const int _supportedSchemaVersion = 1;

/// Load `codeality-dart.yaml` from [projectRoot], or the defaults when it is
/// absent.
DartConfig loadConfig(String projectRoot) {
  final file = File(p.join(projectRoot, 'codeality-dart.yaml'));
  final Map<Object?, Object?> document;
  if (file.existsSync()) {
    final Object? parsed;
    try {
      parsed = loadYaml(file.readAsStringSync());
    } on YamlException catch (error) {
      throw ConfigError(
        'codeality-dart.yaml is not valid YAML: ${error.message}',
      );
    }
    if (parsed != null && parsed is! Map) {
      throw const ConfigError('codeality-dart.yaml must be a mapping');
    }
    document = (parsed as Map?)?.cast<Object?, Object?>() ?? const {};
  } else {
    document = const {};
  }
  rejectUnknownKeys(document);
  final read = ConfigReader(document);
  final schemaVersion = read.integer('schema-version', _supportedSchemaVersion);
  if (schemaVersion != _supportedSchemaVersion) {
    throw ConfigError(
      'codeality-dart.yaml has schema-version $schemaVersion; this release '
      'reads schema-version $_supportedSchemaVersion',
    );
  }
  final roles = {
    'entrypoint': read.strings('roles.entrypoint', const [
      'lib/main.dart',
      'bin/*.dart',
    ]),
    'data': read.strings('roles.data', const []),
    'generated': read.strings('roles.generated', const []),
  };
  rejectDuplicateRoleClaims(roles);
  return DartConfig(
    schemaVersion: schemaVersion,
    sourceRoots: read.strings('source-roots', const ['lib', 'bin']),
    testRoots: read.strings('test-roots', const ['test', 'integration_test']),
    respectGitignore: read.boolean('respect-gitignore', true),
    coverageThreshold: read.integer('coverage-threshold', 80),
    testBudgetSeconds: read.integer('test-budget-seconds', 300),
    maxFileLines: read.integer('limits.max-file-lines', 150),
    testMaxFileLines: read.integer('limits.test-max-file-lines', 300),
    roles: roles,
    sqlGlobs: read.strings('sql-globs', const ['**/*.drift', '**/*.sql']),
    duplicatesMinTokens: read.optionalInteger('duplicates.min-tokens'),
    duplicatesThreshold: read.optionalNumber('duplicates.threshold'),
  );
}
