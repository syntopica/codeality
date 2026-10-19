import 'package:codeality_dart/src/init/plan_analysis_options.dart';
import 'package:codeality_dart/src/init/plan_disposition.dart';
import 'package:test/test.dart';
import 'package:yaml/yaml.dart';

import '../support/repo_fixture.dart';

void main() {
  late RepoFixture repo;
  setUp(() => repo = RepoFixture());
  tearDown(() => repo.dispose());

  test(
    'a missing file is created with the Flutter include for a Flutter app',
    () {
      final planned = planAnalysisOptions(repo.flutterApp('app'));
      expect(planned.disposition, PlanDisposition.create);
      final document = loadYaml(planned.content!) as YamlMap;
      expect(document['include'], 'package:codeality_lints/flutter.yaml');
      expect(
        (document['analyzer'] as YamlMap)['exclude'],
        contains('build/**'),
      );
    },
  );

  test('a pure Dart package gets the pure include', () {
    final planned = planAnalysisOptions(repo.dartPackage('core'));
    final document = loadYaml(planned.content!) as YamlMap;
    expect(
      document['include'],
      'package:codeality_lints/analysis_options.yaml',
    );
  });

  test(
    'an existing file is merged: include replaced, comments and flags kept',
    () {
      final root = repo.flutterApp('app');
      repo.write('app/analysis_options.yaml', '''
# Local tweaks stay.
include: package:flutter_lints/flutter.yaml

analyzer:
  exclude:
    - build/**
  language:
    strict-casts: true

linter:
  rules:
    - prefer_single_quotes
''');
      final planned = planAnalysisOptions(root);
      expect(planned.disposition, PlanDisposition.merge);
      expect(planned.detail, contains('package:flutter_lints/flutter.yaml'));
      expect(planned.content, contains('# Local tweaks stay.'));
      final document = loadYaml(planned.content!) as YamlMap;
      expect(document['include'], 'package:codeality_lints/flutter.yaml');
      final analyzer = document['analyzer'] as YamlMap;
      expect((analyzer['language'] as YamlMap)['strict-casts'], isTrue);
      expect(
        analyzer['exclude'],
        containsAll(['build/**', 'ios/**', '**/*.g.dart']),
      );
      expect((document['linter'] as YamlMap)['rules'], [
        'prefer_single_quotes',
      ]);
    },
  );

  test('a file that already matches is unchanged', () {
    final root = repo.dartPackage('core');
    repo.write(
      'core/analysis_options.yaml',
      planAnalysisOptions(root).content!,
    );
    expect(planAnalysisOptions(root).disposition, PlanDisposition.unchanged);
  });

  test('an include list without the codeality set is a conflict', () {
    final root = repo.dartPackage('core');
    repo.write(
      'core/analysis_options.yaml',
      'include:\n  - package:lints/core.yaml\n',
    );
    expect(planAnalysisOptions(root).disposition, PlanDisposition.conflict);
  });
}
