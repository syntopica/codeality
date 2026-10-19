# codeality_dart

Strict quality gate for Dart and Flutter projects, part of
[codeality](https://github.com/syntopica/codeality).

```sh
dart pub global activate codeality_dart
codeality-dart init            # plan what would change
codeality-dart init --apply --ci
codeality-dart gate
```

Commands: `check` (structural rules `BDT000`-`BDT007`),
`baseline create|update|check` (debt), `gate` (format, analyze, structure,
duplicates, test with coverage, audit), `init` (merge config and CI).

Pair it with the lint set in
[`codeality_lints`](https://pub.dev/packages/codeality_lints).
