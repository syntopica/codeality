import 'package:codeality_dart/src/baseline/classify_fingerprints.dart';
import 'package:test/test.dart';

void main() {
  test('occurrences beyond the recorded count are new', () {
    final result = classifyFingerprints(['a', 'a'], {'a': 1});
    expect(result.states, ['known', 'new']);
    expect(result.newCount, 1);
    expect(result.knownCount, 1);
    expect(result.resolvedCount, 0);
  });

  test('recorded occurrences no longer present are resolved', () {
    final result = classifyFingerprints(['a'], {'a': 2, 'b': 1});
    expect(result.states, ['known']);
    expect(result.resolvedCount, 2);
  });

  test('without a record everything is new', () {
    expect(classifyFingerprints(['x'], const {}).states, ['new']);
  });
}
