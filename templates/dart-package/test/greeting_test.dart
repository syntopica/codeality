import 'package:dart_package/greeting.dart';
import 'package:test/test.dart';

void main() {
  test('greets by name', () => expect(greeting(' Ada '), 'Hello, Ada!'));

  test('a blank name greets the world', () {
    expect(greeting('  '), 'Hello, world!');
  });
}
