import 'package:yaml/yaml.dart';

/// The job [jobId] that [jobText] (indented to sit under `jobs:`) defines.
Object? parseJob(String jobId, String jobText) {
  final document = loadYaml('jobs:\n$jobText') as YamlMap;
  return (document['jobs'] as YamlMap)[jobId];
}
