import '../config/dart_config.dart';

/// Whether [path] lives under a test root or is named like a test.
bool isTestPath(String path, DartConfig config) =>
    path.endsWith('_test.dart') ||
    config.testRoots.any((root) => path.startsWith('$root/'));
