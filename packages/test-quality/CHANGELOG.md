# Changelog

## 0.1.0

- First release. `codeality-test check` reads the suite through the project's
  own vitest config without running it and the git hooks: files that run in more
  than one project (`duplicate-file-run`), files under jsdom/happy-dom that name
  no DOM API (`dom-environment-unused`), lint and format steps a hook reaches
  without a cache (`uncached-hook-lint`), and a hook that runs the static gate
  and the whole suite (`hook-runs-full-gate`, info).
- `codeality-test measure` runs the suite once with a JSON report and samples
  the memory of vitest and its workers: environment setup against test time
  (`environment-dominates`, vitest 4 seconds and vitest 5 shares), slowest
  files, peak and mean RSS. `--node-candidates` reruns the DOM-free candidates
  under `--environment node` and reports the ones that pass.
