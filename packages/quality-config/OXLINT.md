# oxlint as a pre-filter

`oxlintrc.json` is deliberately one category wide.

`correctness` is the set whose findings ESLint would also reject, so oxlint can
fail a build in seconds without introducing a second opinion the authority does
not share. Typed linting over a few thousand files takes minutes and, on the
largest repository in the estate, needed `--max-old-space-size=6144` and a
35-minute timeout before it stopped dying at `exit 134`. A gate that slow is one
people learn to skip; a two-second first pass over the same files is what keeps
the slow one worth waiting for.

Adding `suspicious` or `pedantic` here turns the pre-filter into a rival linter.
It starts reporting style ESLint is silent about - `Array#sort` versus
`Array#toSorted`, a dangling underscore in `__dirname` - and the fast gate
becomes the one people argue with rather than the one that catches real breaks
early. Measured on this repository: `correctness` reported nothing, the two
wider categories reported 19 findings, none of which ESLint considers a problem.

oxlint does not replace ESLint. The pass configured here runs without type
information (oxlint's type-aware mode is a separate engine, `oxlint-tsgolint`,
not enabled here), so it cannot see `no-floating-promises`,
`no-unnecessary-condition`, or anything else in `strictTypeChecked` - which is
most of what the baseline actually enforces.

The generated pre-commit hook runs oxlint and ESLint in parallel, not oxlint
first. Piping them was measured on 2026-10-13 against the `ts-package` template,
one staged file, lefthook 2.2.1: a file oxlint rejects finished in 0.5 s instead
of 2.5 s, but a clean file - the usual commit - took 2.2 s instead of 1.7 s.
oxlint's `correctness` set rarely fires, so the parallel hook is the faster one
in practice.
