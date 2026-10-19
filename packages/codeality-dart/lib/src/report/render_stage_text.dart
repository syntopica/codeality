import '../gate/stage_result.dart';

/// One stage: a status line, its detail, then each new finding.
List<String> renderStageText(StageResult stage) => [
  ('${stage.status.name.padRight(9)} ${stage.name} '
      '(${(stage.duration.inMilliseconds / 1000).toStringAsFixed(1)}s) '
      '${stage.command}'),
  if (stage.detail.isNotEmpty) '          ${stage.detail}',
  if (stage.knownCount > 0 || stage.resolvedCount > 0)
    ('          ${stage.newCount} new, ${stage.knownCount} known, '
        '${stage.resolvedCount} resolved'),
  for (final finding in stage.findings)
    if (finding.baselineState == 'new')
      ('          ${finding.location.path}:${finding.location.line}:'
          '${finding.location.column}: ${finding.code}: ${finding.message}'),
];
