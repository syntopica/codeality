# Changelog

## Unreleased

- Fix: a source file that exists but cannot be read (permissions, invalid UTF-8)
  is an infrastructure error, exit 3, instead of being checked as an empty file
  and passing.

## 0.1.0

- Initial release: `check`, `baseline`, `gate` and `init` for Swift sources.
