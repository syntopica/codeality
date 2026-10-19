import '../assets/jscpd_defaults.dart';
import '../config/dart_config.dart';
import '../roles/default_generated_globs.dart';

/// The jscpd configuration for a Dart project: the shared defaults, the
/// project's overrides, and the generated globs.
Map<String, Object?> jscpdConfig(DartConfig config, String outputDirectory) => {
  'minTokens': config.duplicatesMinTokens ?? JscpdDefaults.minTokens,
  'format': ['dart'],
  'gitignore': true,
  // Absolute names, made project-relative by parseJscpdReport: jscpd
  // otherwise names files relative to the root it scanned.
  'absolute': true,
  'ignore': [
    ...JscpdDefaults.ignore,
    ...defaultGeneratedGlobs,
    ...?config.roles['generated'],
  ],
  'reporters': ['json'],
  'output': outputDirectory,
  'silent': true,
};
