import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';
import 'tool_run.dart';

/// A stage that could not run: the tool is missing or crashed.
StageResult infrastructureFailure(String name, StageKind kind, ToolRun run) =>
    StageResult(
      name: name,
      kind: kind,
      command: run.command,
      status: StageStatus.failedToRun,
      exitCode: run.missing ? null : run.exitCode,
      detail: run.missing
          ? 'tool not found: ${run.stderr}'
          : 'exit ${run.exitCode}: ${run.stderr.trim()}',
    );
