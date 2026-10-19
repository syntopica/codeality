/// The resolved configuration of one Dart project.
final class DartConfig {
  const DartConfig({
    required this.schemaVersion,
    required this.sourceRoots,
    required this.testRoots,
    required this.respectGitignore,
    required this.coverageThreshold,
    required this.testBudgetSeconds,
    required this.maxFileLines,
    required this.testMaxFileLines,
    required this.roles,
    required this.sqlGlobs,
    required this.duplicatesMinTokens,
    required this.duplicatesThreshold,
  });

  final int schemaVersion;
  final List<String> sourceRoots;
  final List<String> testRoots;
  final bool respectGitignore;
  final int coverageThreshold;
  final int testBudgetSeconds;
  final int maxFileLines;
  final int testMaxFileLines;

  /// Configured role name (`entrypoint`, `data`, `generated`) to globs.
  final Map<String, List<String>> roles;
  final List<String> sqlGlobs;
  final int? duplicatesMinTokens;
  final num? duplicatesThreshold;
}
