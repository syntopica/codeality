#!/usr/bin/env bash
# Proves each lint set is wired: the pure fixture must report a codeality
# strict rule, the Flutter fixture must also report a Flutter-only rule, and
# neither may name an unknown lint.
set -euo pipefail
cd "$(dirname "$0")/.."

expect() {
  local fixture=$1 tool=$2
  shift 2
  (cd "test_fixtures/$fixture" && $tool pub get >/dev/null)
  local output
  output=$(cd "test_fixtures/$fixture" && dart analyze --format=machine . 2>&1 || true)
  if grep -qiE 'undefined_lint|removed_lint|deprecated_lint' <<<"$output"; then
    echo "$fixture: the lint set names a rule this SDK does not know:" >&2
    grep -iE 'undefined_lint|removed_lint|deprecated_lint' <<<"$output" >&2
    exit 1
  fi
  for rule in "$@"; do
    if ! grep -qi "|$rule|" <<<"$output"; then
      echo "$fixture: expected $rule, got:" >&2
      echo "$output" >&2
      exit 1
    fi
  done
  echo "$fixture: ok ($*)"
}

expect pure dart prefer_final_locals
expect flutter_only flutter prefer_final_locals use_key_in_widget_constructors
