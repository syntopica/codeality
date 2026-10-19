import 'package:codeality_dart/src/model/module_role.dart';
import 'package:test/test.dart';

import '../support/source.dart';

void main() {
  late FixtureProject project;
  setUp(() => project = FixtureProject());
  tearDown(() => project.dispose());

  test('parses without resolving imports and assigns the role', () {
    final file = project.file(
      'lib/widget.dart',
      "import 'package:flutter/widgets.dart';\nclass A extends StatelessWidget {}\n",
    );
    expect(file.parseErrors, isEmpty);
    expect(file.role, ModuleRole.ordinary);
    expect(file.unit.declarations, hasLength(1));
  });

  test('a byte order mark is ignored', () {
    final file = project.file('lib/a.dart', '﻿class A {}\n');
    expect(file.parseErrors, isEmpty);
  });

  test('broken syntax is recorded, not thrown', () {
    final file = project.file('lib/a.dart', 'class A {\n');
    expect(file.parseErrors, isNotEmpty);
  });
}
