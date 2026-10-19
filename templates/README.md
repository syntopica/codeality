# Templates

These folders are **validated starters** for Next.js, Vite + React, Vite + Vue,
Nuxt 4, Astro, Tauri, a generic TypeScript package, a Python package, a Dart
package and a Flutter app.

## Published dependencies

Templates depend on **`@syntopica/*` packages at `^0.1.0`**. Until those
versions are published to npm, the monorepo root may use **`pnpm.overrides`** to
pull them from GitHub; see the root [README.md](../README.md).

When you **copy a template out** of this repository, keep **npm semver** ranges,
for example:

```json
"@syntopica/eslint-config": "^0.1.0",
"@syntopica/prettier-config": "^0.1.0",
"@syntopica/tsconfig": "^0.1.0"
```

Then run `pnpm install` or `npm install`. See
[docs/migration.md](../docs/migration.md).

## python-package

`python-package` is the odd one out: it is a **uv** project, not a pnpm one, and
its quality chain is `codeality-py gate` rather than `pnpm check:ci`. It depends
on `syntopica-codeality-py` from PyPI and ships a committed `uv.lock`.

```bash
uv sync --group quality
uv run codeality-py gate
```

## dart-package and flutter-app

Like `python-package`, these are outside the pnpm workspace: Dart projects whose
quality chain is `codeality-dart gate`. Inside this repository they take
`codeality_lints` by `path:`; when you copy one out, replace that with
`codeality_lints: ^0.1.0` and activate the CLI:

```bash
dart pub global activate codeality_dart
dart pub get            # flutter pub get for flutter-app
codeality-dart gate
```

`flutter-app` carries no platform folders; add the ones you need with
`flutter create --platforms ios,android .`, which leaves the existing files
alone.
