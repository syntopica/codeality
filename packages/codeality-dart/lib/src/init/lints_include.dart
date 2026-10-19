/// The codeality_lints file a project includes.
String lintsInclude({required bool flutter}) => flutter
    ? 'package:codeality_lints/flutter.yaml'
    : 'package:codeality_lints/analysis_options.yaml';
