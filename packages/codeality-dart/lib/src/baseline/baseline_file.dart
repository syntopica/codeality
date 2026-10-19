/// The recorded debt of one project: per section, fingerprint to count.
final class BaselineFile {
  const BaselineFile({
    this.schemaVersion = currentSchemaVersion,
    this.toolVersion = '',
    required this.sections,
  });

  static const int currentSchemaVersion = 1;
  static const String fileName = '.codeality-dart-baseline.json';

  final int schemaVersion;
  final String toolVersion;
  final Map<String, Map<String, int>> sections;

  Map<String, int> section(String name) => sections[name] ?? const {};

  BaselineFile withSection(String name, Map<String, int> counts) =>
      BaselineFile(
        schemaVersion: schemaVersion,
        toolVersion: toolVersion,
        sections: {...sections, name: counts},
      );
}
