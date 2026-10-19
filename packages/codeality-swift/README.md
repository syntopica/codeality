# codeality-swift

Strict quality gate for Swift sources: one unit per file, file-size caps, banned
grab-bag names, no inline SQL, `swift format`, optional `swiftlint`, and
duplicate detection, with a debt baseline so an existing codebase can adopt it
without a rewrite. Works on plain directories of `.swift` files; no
`Package.swift` is needed in the project it checks. Runs on macOS and Linux.

The full surface is described as it lands; see `CHANGELOG.md`.
