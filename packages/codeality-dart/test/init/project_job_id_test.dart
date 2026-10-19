import 'package:codeality_dart/src/init/project_job_id.dart';
import 'package:test/test.dart';

void main() {
  test('derives the job id from the path relative to the repository', () {
    expect(projectJobId('/r', '/r/apps/mobile'), 'dart-apps-mobile');
    expect(
      projectJobId('/r', '/r/packages/click_core'),
      'dart-packages-click-core',
    );
  });

  test('a project at the repository root is plain dart', () {
    expect(projectJobId('/r', '/r'), 'dart');
  });
}
