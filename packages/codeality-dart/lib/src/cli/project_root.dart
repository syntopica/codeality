import 'dart:io';

import 'package:args/args.dart';
import 'package:path/path.dart' as p;

/// The `--project` directory, absolute and normalised.
String projectRoot(ArgResults results) => p.normalize(
  p.absolute(results.option('project') ?? Directory.current.path),
);
