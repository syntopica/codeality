import 'dart:io';

import 'package:codeality_dart/src/init/apply_init.dart';
import 'package:codeality_dart/src/init/plan_disposition.dart';
import 'package:codeality_dart/src/init/plan_init.dart';
import 'package:codeality_dart/src/init/planned_file.dart';
import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

import '../support/repo_fixture.dart';

const _workflow = '.github/workflows/codeality.yml';

void main() {
  late RepoFixture repo;
  setUp(() => repo = RepoFixture());
  tearDown(() => repo.dispose());

  List<PlannedFile> plan(String root) =>
      planInit(root, ci: true, profile: 'app', sdkVersion: '3.47.6');

  PlannedFile workflowOf(List<PlannedFile> planned) =>
      planned.singleWhere((f) => f.path.endsWith(_workflow));

  YamlMap jobs() =>
      (loadYaml(repo.read(_workflow)) as YamlMap)['jobs'] as YamlMap;

  test('two projects share one root workflow, one job each', () {
    final mobile = repo.flutterApp('apps/mobile');
    final core = repo.dartPackage('packages/click_core');
    applyInit(plan(mobile), force: false);
    expect(workflowOf(plan(core)).disposition, PlanDisposition.merge);
    applyInit(plan(core), force: false);
    expect(jobs().keys, ['dart-apps-mobile', 'dart-packages-click-core']);
    final mobileJob = jobs()['dart-apps-mobile'] as YamlMap;
    expect(
      ((mobileJob['defaults'] as YamlMap)['run']
          as YamlMap)['working-directory'],
      'apps/mobile',
    );
    final on = (loadYaml(repo.read(_workflow)) as YamlMap)['on'] as YamlMap;
    expect(on.keys, containsAll(['workflow_call', 'workflow_dispatch']));
  });

  test('re-running is unchanged; editing a job makes it a conflict', () {
    final mobile = repo.flutterApp('apps/mobile');
    applyInit(plan(mobile), force: false);
    expect(workflowOf(plan(mobile)).disposition, PlanDisposition.unchanged);
    repo.write(
      _workflow,
      repo.read(_workflow).replaceFirst('ubuntu-latest', 'macos-latest'),
    );
    expect(workflowOf(plan(mobile)).disposition, PlanDisposition.conflict);
    applyInit(plan(mobile), force: true);
    expect(workflowOf(plan(mobile)).disposition, PlanDisposition.unchanged);
  });

  test('with no other workflow, a minimal caller is planned', () {
    final mobile = repo.flutterApp('apps/mobile');
    final caller = plan(mobile)
        .singleWhere((f) => f.path.endsWith('.github/workflows/quality.yml'));
    expect(caller.disposition, PlanDisposition.create);
    expect(caller.content, contains('uses: ./.github/workflows/codeality.yml'));
  });

  test(
    'an existing CI workflow is left alone and the report says how to call',
    () {
      final mobile = repo.flutterApp('apps/mobile');
      repo.write('.github/workflows/ci.yml', 'name: CI\non: push\njobs: {}\n');
      final planned = plan(mobile);
      expect(planned.where((f) => f.path.endsWith('quality.yml')), isEmpty);
      expect(
        planned.map((f) => f.detail).join('\n'),
        contains('uses: ./.github/workflows/codeality.yml'),
      );
    },
  );

  test('generated workflows pass actionlint', () {
    final which = Process.runSync('which', ['actionlint']);
    if (which.exitCode != 0) {
      markTestSkipped('actionlint is not installed locally; CI runs it');
      return;
    }
    applyInit(plan(repo.flutterApp('apps/mobile')), force: false);
    applyInit(plan(repo.dartPackage('packages/click_core')), force: false);
    final result = Process.runSync(
      'actionlint',
      [],
      workingDirectory: repo.root,
    );
    expect(result.exitCode, 0, reason: '${result.stdout}${result.stderr}');
  });
}
