# Python Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `busirocket-baseline-py`, a CLI that scaffolds the house Python
quality configuration into a repository and enforces the six structural rules
that no existing Python tool covers.

**Architecture:** One package in `packages/baseline-py`, `src/` layout, stdlib
`ast` for parsing, `tomlkit` for comment-preserving TOML edits, `click` for the
CLI. The engine is a pipeline: traverse configured roots, assign exactly one
module role per file, parse, run rules, classify findings against the baseline,
render text or JSON. Rules never see a file whose role exempts them.

**Tech Stack:** Python 3.12+, uv, hatchling, click, tomlkit, pytest, ruff, mypy.

**Spec:** `docs/superpowers/specs/2026-08-31-python-baseline-design.md`

## Global Constraints

- Distribution `busirocket-baseline-py`; import package `baseline_py`;
  executable `baseline-py`.
- `requires-python = ">=3.12"` for the tool itself. PEP 695 `type` statements
  need a 3.12+ parser. Target projects may declare any floor; the checker parses
  their source with its own interpreter.
- The package dogfoods the house rules: one primary declaration per file, file
  name equal to the snake_case of that declaration, no `utils`/`helpers`/
  `misc`/`common` path segment, 150 code lines per file, 300 in tests,
  `__init__.py` as barrel only, no inline SQL.
- Rule codes `BPY000`–`BPY006` are immutable and never reused.
- Exit codes: 0 pass, 1 policy findings, 2 usage or configuration error, 3
  infrastructure failure.
- `check` never writes. Only `baseline create` and `baseline update` write a
  baseline. `init` writes nothing without `--apply` or `--force`.
- A required gate stage whose tool is absent is exit 3, never a skip.
- All code, comments, identifiers, docs and commit messages in English.
- ASCII punctuation in new files.

---

### Task 1: Package skeleton

**Files:**

- Create: `packages/baseline-py/pyproject.toml`
- Create: `packages/baseline-py/README.md`
- Create: `packages/baseline-py/src/baseline_py/__init__.py`
- Create: `packages/baseline-py/src/baseline_py/cli.py`
- Create: `packages/baseline-py/tests/test_cli_version.py`
- Modify: `pnpm-workspace.yaml` (exclude the Python package from pnpm globs if
  the existing `packages/*` glob would pick it up)

**Interfaces:**

- Produces: `baseline_py.cli.cli` — a `click.Group` registered as the
  `baseline-py` console script.

- [ ] **Step 1: Write the failing test**

```python
from click.testing import CliRunner

from baseline_py.cli import cli


def test_cli_reports_its_version() -> None:
    result = CliRunner().invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "baseline-py" in result.output
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd packages/baseline-py && uv run pytest tests/test_cli_version.py -v`
Expected: FAIL, `ModuleNotFoundError: No module named 'baseline_py'`.

- [ ] **Step 3: Write `pyproject.toml`**

```toml
[build-system]
requires = ["hatchling>=1.27,<2"]
build-backend = "hatchling.build"

[project]
name = "busirocket-baseline-py"
version = "0.1.0"
description = "Structural linter and config scaffolder for Python: atomic files, placement, size caps, no inline SQL"
readme = "README.md"
requires-python = ">=3.12"
license = { file = "LICENSE" }
authors = [{ name = "Cristian Deluxe" }]
dependencies = ["click>=8.1,<9", "tomlkit>=0.13,<1"]

[project.scripts]
baseline-py = "baseline_py.cli:cli"

[dependency-groups]
dev = ["mypy>=1.11", "pytest>=8", "pytest-cov>=5", "ruff>=0.15"]

[tool.hatch.build.targets.wheel]
packages = ["src/baseline_py"]

[tool.pytest.ini_options]
addopts = "-ra"
testpaths = ["tests"]
```

- [ ] **Step 4: Write the CLI**

`src/baseline_py/cli.py` holds the single primary declaration `cli`:

```python
"""Command-line entry point for baseline-py."""

from importlib.metadata import version

import click


@click.group(name="baseline-py")
@click.version_option(version("busirocket-baseline-py"), prog_name="baseline-py")
def cli() -> None:
    """Structural linter and config scaffolder for Python."""
```

`src/baseline_py/__init__.py` is a barrel: a docstring and nothing else.

- [ ] **Step 5: Run the test**

Run: `cd packages/baseline-py && uv run pytest -v` Expected: PASS.

- [ ] **Step 6: Copy the LICENSE and write the README**

Copy the repository `LICENSE` into `packages/baseline-py/LICENSE`. The README
states install, the three commands, and links the design spec, matching
`packages/cargo-baseline/README.md` in shape.

- [ ] **Step 7: Commit**

```bash
git add packages/baseline-py
git commit -m "feat(baseline-py): scaffold the package with a versioned CLI"
```

---

### Task 2: Finding model and rule codes

**Files:**

- Create: `packages/baseline-py/src/baseline_py/model/rule_code.py`
- Create: `packages/baseline-py/src/baseline_py/model/severity.py`
- Create: `packages/baseline-py/src/baseline_py/model/location.py`
- Create: `packages/baseline-py/src/baseline_py/model/finding.py`
- Create: `packages/baseline-py/src/baseline_py/model/__init__.py`
- Create: `packages/baseline-py/tests/model/test_rule_code.py`
- Create: `packages/baseline-py/tests/model/test_finding.py`

**Interfaces:**

- Produces:
  - `RuleCode` — a `StrEnum` with members `BPY000`..`BPY006`, each carrying a
    `slug` property (`parse-error`, `one-primary-unit`, `file-matches-unit`,
    `no-grab-bag-names`, `max-file-lines`, `barrel-only-init`, `no-inline-sql`).
  - `Severity` — `StrEnum` with `ERROR` and `ADVISORY`.
  - `Location(path: str, line: int, column: int, end_line: int | None, end_column: int | None)`
    — a frozen dataclass; `path` is project-root-relative POSIX.
  - `Finding(code: RuleCode, severity: Severity, message: str, location: Location, subject: str | None, related: tuple[Location, ...], fingerprint: str)`
    — a frozen dataclass.

- [ ] **Step 1: Write the failing tests**

```python
from baseline_py.model.rule_code import RuleCode


def test_every_rule_code_has_a_slug() -> None:
    assert RuleCode.BPY001.slug == "one-primary-unit"
    assert len({code.slug for code in RuleCode}) == len(RuleCode)
```

```python
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity


def test_findings_are_ordered_by_path_then_location_then_code() -> None:
    first = Finding(
        code=RuleCode.BPY004,
        severity=Severity.ERROR,
        message="too long",
        location=Location(path="a.py", line=1, column=1, end_line=None, end_column=None),
        subject=None,
        related=(),
        fingerprint="x",
    )
    second = Finding(
        code=RuleCode.BPY001,
        severity=Severity.ERROR,
        message="two units",
        location=Location(path="b.py", line=1, column=1, end_line=None, end_column=None),
        subject="Thing",
        related=(),
        fingerprint="y",
    )
    assert sorted([second, first]) == [first, second]
```

- [ ] **Step 2: Run them and watch them fail**

Run: `uv run pytest tests/model -v` Expected: FAIL, module not found.

- [ ] **Step 3: Implement the four modules**

One declaration per file. `Finding` implements `__lt__` sorting on
`(location.path, location.line, location.column, code)`. `Location` is frozen
and orderable.

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/model -v` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/model packages/baseline-py/tests/model
git commit -m "feat(baseline-py): add the finding model and immutable rule codes"
```

---

### Task 3: Configuration schema and loading

**Files:**

- Create: `packages/baseline-py/src/baseline_py/config/limits.py`
- Create: `packages/baseline-py/src/baseline_py/config/module_role.py`
- Create: `packages/baseline-py/src/baseline_py/config/override.py`
- Create: `packages/baseline-py/src/baseline_py/config/baseline_config.py`
- Create: `packages/baseline-py/src/baseline_py/config/load_config.py`
- Create: `packages/baseline-py/src/baseline_py/config/config_error.py`
- Create: `packages/baseline-py/tests/config/test_load_config.py`

**Interfaces:**

- Produces:
  - `ModuleRole` — `StrEnum`: `EXCLUDED`, `GENERATED`, `STUB`, `TEST`,
    `NAMESPACE_INIT`, `BARREL`, `ENTRYPOINT`, `DATA`, `REGISTRY`, `ORDINARY`.
  - `Limits(max_file_lines: int, test_max_file_lines: int)`.
  - `Override(paths: tuple[str, ...], disable: tuple[RuleCode, ...], reason: str)`.
  - `BaselineConfig(schema_version, project_root: Path, source_roots, test_roots, respect_gitignore, limits, roles: Mapping[ModuleRole, tuple[str, ...]], overrides, sql_resource_globs, import_package)`.
  - `load_config(project_root: Path) -> BaselineConfig` — reads
    `baseline-py.toml`, returns defaults when absent.
  - `ConfigError(Exception)` — carries a message; the CLI maps it to exit 2.

- [ ] **Step 1: Write the failing tests**

```python
import pytest

from baseline_py.config.config_error import ConfigError
from baseline_py.config.load_config import load_config
from baseline_py.config.module_role import ModuleRole


def test_defaults_apply_when_no_config_file_exists(tmp_path) -> None:
    config = load_config(tmp_path)
    assert config.limits.max_file_lines == 150
    assert config.limits.test_max_file_lines == 300
    assert config.source_roots == ("src",)


def test_unknown_key_is_fatal(tmp_path) -> None:
    (tmp_path / "baseline-py.toml").write_text(
        'schema-version = 1\nmax_file_lines = 150\n', encoding="utf-8"
    )
    with pytest.raises(ConfigError, match="unknown key"):
        load_config(tmp_path)


def test_unsupported_schema_version_is_fatal(tmp_path) -> None:
    (tmp_path / "baseline-py.toml").write_text("schema-version = 99\n", encoding="utf-8")
    with pytest.raises(ConfigError, match="schema-version"):
        load_config(tmp_path)


def test_a_file_claimed_by_two_roles_is_fatal(tmp_path) -> None:
    (tmp_path / "baseline-py.toml").write_text(
        'schema-version = 1\n[roles]\ndata = ["src/a.py"]\nregistry = ["src/a.py"]\n',
        encoding="utf-8",
    )
    with pytest.raises(ConfigError, match="claimed by"):
        load_config(tmp_path)


def test_roles_are_read_from_the_file(tmp_path) -> None:
    (tmp_path / "baseline-py.toml").write_text(
        'schema-version = 1\n[roles]\ndata = ["src/constants.py"]\n', encoding="utf-8"
    )
    config = load_config(tmp_path)
    assert config.roles[ModuleRole.DATA] == ("src/constants.py",)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `uv run pytest tests/config -v` Expected: FAIL, module not found.

- [ ] **Step 3: Implement the config modules**

`load_config` validates in this order and raises `ConfigError` on the first
failure: file parses as TOML; `schema-version` present and equal to 1; every
top-level key and every key inside `[limits]`, `[roles]`, `[[overrides]]` is
known; every glob compiles; no literal path appears under two roles; every
`disable` entry is a known `RuleCode`; an override whose `paths` contains a `**`
segment requires a non-empty `reason`.

Defaults: `source-roots = ["src"]`, `test-roots = ["tests"]`,
`respect-gitignore = true`, `max-file-lines = 150`, `test-max-file-lines = 300`,
`sql-resource-globs = ["sql/**/*.sql"]`, generated role globs
`["**/migrations/*.py", "**/*_pb2.py", "**/*_pb2_grpc.py", "**/ui_*.py", "**/*_ui.py", "**/resources_rc.py"]`.

When `source-roots` is absent and `src/` does not exist, fall back to the
directories directly under the project root that contain an `__init__.py`, so
`atrium/atrium` and `mempalace/mempalace` work without configuration. Record the
resolved roots on the config for reporting.

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/config -v` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/config packages/baseline-py/tests/config
git commit -m "feat(baseline-py): load and validate the versioned configuration schema"
```

---

### Task 4: Traversal

**Files:**

- Create: `packages/baseline-py/src/baseline_py/traversal/default_excludes.py`
- Create: `packages/baseline-py/src/baseline_py/traversal/gitignore_matcher.py`
- Create:
  `packages/baseline-py/src/baseline_py/traversal/collect_source_files.py`
- Create: `packages/baseline-py/tests/traversal/test_collect_source_files.py`

**Interfaces:**

- Consumes: `BaselineConfig`.
- Produces:
  - `DEFAULT_EXCLUDES: frozenset[str]` — the directory names from the spec.
  - `collect_source_files(config: BaselineConfig) -> tuple[Path, ...]` — sorted,
    absolute, `.py` and `.pyi`, restricted to the configured roots, never
    following a directory symlink whose resolved target leaves the project root.

- [ ] **Step 1: Write the failing tests**

```python
def test_only_configured_roots_are_scanned(tmp_path) -> None: ...
def test_default_excluded_directories_are_skipped(tmp_path) -> None: ...
def test_symlinked_directory_escaping_the_root_is_not_followed(tmp_path) -> None: ...
def test_gitignored_file_is_skipped_when_respect_gitignore_is_true(tmp_path) -> None: ...
def test_vendor_excludes_are_not_overridable_by_gitignore_negation(tmp_path) -> None: ...
```

Each test builds a tree with `tmp_path`, writes a `baseline-py.toml`, and
asserts on the relative paths returned. Write the bodies in full; the names
above are the contract.

- [ ] **Step 2: Run them and watch them fail**

Run: `uv run pytest tests/traversal -v` Expected: FAIL.

- [ ] **Step 3: Implement traversal**

Walk each configured root with `os.walk(followlinks=False)`, pruning directories
whose name is in `DEFAULT_EXCLUDES`, then applying `.gitignore` when
`respect_gitignore` is set. `gitignore_matcher` reads the project-root
`.gitignore` only, supports `#` comments, blank lines, trailing `/`, `!`
negation and `**`, and is documented as not covering nested `.gitignore` files
in v1. Vendor excludes are applied after negation so `!` cannot resurrect
`site-packages`.

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/traversal -v` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/traversal packages/baseline-py/tests/traversal
git commit -m "feat(baseline-py): scan configured roots with a documented traversal contract"
```

---

### Task 5: Module role assignment

**Files:**

- Create: `packages/baseline-py/src/baseline_py/roles/test_file_patterns.py`
- Create: `packages/baseline-py/src/baseline_py/roles/assign_module_role.py`
- Create: `packages/baseline-py/tests/roles/test_assign_module_role.py`

**Interfaces:**

- Consumes: `BaselineConfig`, `ModuleRole`.
- Produces:
  `assign_module_role(relative_path: str, config: BaselineConfig) -> ModuleRole`
  — applies the precedence
  `EXCLUDED > GENERATED > STUB > TEST > NAMESPACE_INIT > BARREL > ENTRYPOINT/DATA/REGISTRY > ORDINARY`.

- [ ] **Step 1: Write the failing tests**

```python
def test_stub_files_take_the_stub_role() -> None:
    assert assign_module_role("src/pkg/api.pyi", default_config()) is ModuleRole.STUB


def test_waveform_test_py_is_recognised_as_a_test() -> None:
    assert assign_module_role("waveform_test.py", default_config()) is ModuleRole.TEST


def test_generated_wins_over_test() -> None:
    assert assign_module_role("tests/thing_pb2.py", default_config()) is ModuleRole.GENERATED


def test_init_is_a_barrel() -> None:
    assert assign_module_role("src/pkg/__init__.py", default_config()) is ModuleRole.BARREL


def test_configured_data_role_beats_ordinary() -> None: ...
def test_generated_role_is_never_inferred_from_file_size() -> None: ...
```

Test patterns covered: `tests/**`, `test_*.py`, `*_test.py`, `tests.py`,
`conftest.py`, plus configured patterns.

- [ ] **Step 2: Run and watch them fail**

Run: `uv run pytest tests/roles -v`

- [ ] **Step 3: Implement role assignment**

Pure function over the relative path and config. No file reads: nothing about a
role may depend on file content or size.

- [ ] **Step 4: Run the tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/roles packages/baseline-py/tests/roles
git commit -m "feat(baseline-py): assign exactly one module role before any rule runs"
```

---

### Task 6: Source file parsing and BPY000

**Files:**

- Create: `packages/baseline-py/src/baseline_py/parsing/source_file.py`
- Create: `packages/baseline-py/src/baseline_py/parsing/parse_source_file.py`
- Create: `packages/baseline-py/src/baseline_py/parsing/infrastructure_error.py`
- Create: `packages/baseline-py/tests/parsing/test_parse_source_file.py`

**Interfaces:**

- Produces:
  - `SourceFile(relative_path: str, role: ModuleRole, text: str, tree: ast.Module | None, parse_error: Finding | None)`.
  - `parse_source_file(absolute_path, relative_path, role) -> SourceFile` — a
    `SyntaxError` becomes a `BPY000` finding on the reported line; an `OSError`,
    a decoding failure or a `RecursionError` raises `InfrastructureError`, which
    the CLI maps to exit 3.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_syntax_error_becomes_a_bpy000_finding(tmp_path) -> None: ...
def test_an_unreadable_file_raises_infrastructure_error(tmp_path) -> None: ...
def test_a_parsed_file_exposes_its_module_tree(tmp_path) -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement parsing**

Read bytes, decode with `tokenize.detect_encoding`, parse with
`ast.parse(text, filename=relative_path)`. Never swallow a parse failure.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/parsing packages/baseline-py/tests/parsing
git commit -m "feat(baseline-py): parse sources and report syntax failures as BPY000"
```

---

### Task 7: BPY004 max-file-lines

**Files:**

- Create: `packages/baseline-py/src/baseline_py/rules/count_code_lines.py`
- Create: `packages/baseline-py/src/baseline_py/rules/max_file_lines.py`
- Create: `packages/baseline-py/tests/rules/test_max_file_lines.py`

**Interfaces:**

- Produces:
  - `count_code_lines(source: SourceFile) -> int` — every occupied line that is
    not blank, not a comment-only line, and not inside a module, class or
    function docstring span. Decorators count. Every physical line of an
    assigned multiline string counts.
  - `max_file_lines(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]`
    — uses `test_max_file_lines` for the `TEST` role, `max_file_lines`
    otherwise; returns nothing for exempt roles.

- [ ] **Step 1: Write the failing tests**

```python
def test_blank_and_comment_lines_do_not_count() -> None: ...
def test_docstrings_do_not_count_but_data_strings_do() -> None: ...
def test_decorator_lines_count() -> None: ...
def test_tests_use_the_looser_test_cap() -> None: ...
def test_generated_and_stub_roles_are_exempt() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the counter**

Collect docstring line spans by walking the tree for `Module`, `ClassDef`,
`FunctionDef` and `AsyncFunctionDef` nodes whose first body statement is an
`Expr` wrapping a string `Constant`, and subtract those spans from the occupied
non-comment lines derived from `tokenize`.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/rules/count_code_lines.py packages/baseline-py/src/baseline_py/rules/max_file_lines.py packages/baseline-py/tests/rules/test_max_file_lines.py
git commit -m "feat(baseline-py): cap code lines per file with a separate test cap"
```

---

### Task 8: BPY003 no-grab-bag-names

**Files:**

- Create: `packages/baseline-py/src/baseline_py/rules/grab_bag_names.py`
- Create: `packages/baseline-py/src/baseline_py/rules/no_grab_bag_names.py`
- Create: `packages/baseline-py/tests/rules/test_no_grab_bag_names.py`

**Interfaces:**

- Produces:
  - `GRAB_BAG_NAMES: frozenset[str]` = `{"utils", "helpers", "misc", "common"}`.
  - `no_grab_bag_names(source, config) -> tuple[Finding, ...]`.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_grab_bag_file_stem_is_reported() -> None: ...
def test_a_grab_bag_package_segment_is_reported() -> None: ...  # utils/parse.py
def test_matching_is_case_insensitive() -> None: ...            # Utils/
def test_substrings_are_not_matched() -> None: ...              # utils_test.py is fine
def test_tests_are_not_exempt() -> None: ...                    # tests/helpers.py
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the rule**

Split the relative path on `/`, drop the `.py`/`.pyi` suffix from the last
segment, case-fold each segment, and compare for equality against the set.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/rules/grab_bag_names.py packages/baseline-py/src/baseline_py/rules/no_grab_bag_names.py packages/baseline-py/tests/rules/test_no_grab_bag_names.py
git commit -m "feat(baseline-py): ban grab-bag names in every path segment"
```

---

### Task 9: BPY005 barrel-only-init

**Files:**

- Create: `packages/baseline-py/src/baseline_py/rules/barrel_only_init.py`
- Create: `packages/baseline-py/tests/rules/test_barrel_only_init.py`

**Interfaces:**

- Produces: `barrel_only_init(source, config) -> tuple[Finding, ...]`, applied
  to the `BARREL` role only.

- [ ] **Step 1: Write the failing tests**

```python
def test_docstring_imports_and_static_all_are_allowed() -> None: ...
def test_a_function_definition_in_a_barrel_is_reported() -> None: ...
def test_a_module_scope_call_is_reported() -> None: ...
def test_dunder_version_assignment_is_allowed() -> None: ...
def test_type_checking_block_with_imports_only_is_allowed() -> None: ...
def test_type_checking_block_containing_a_class_is_reported() -> None: ...
def test_namespace_init_role_is_exempt() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the grammar check**

Walk only the module body. Allow: a leading docstring `Expr`, `Import`,
`ImportFrom`, an `If` whose test is the name `TYPE_CHECKING` and whose body is
imports only, an assignment to `__all__` whose value is a list or tuple of
string constants, and an assignment to `__version__`. Everything else is a
finding anchored on its own line.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/rules/barrel_only_init.py packages/baseline-py/tests/rules/test_barrel_only_init.py
git commit -m "feat(baseline-py): restrict __init__.py to the barrel grammar"
```

---

### Task 10: BPY001 one-primary-unit

**Files:**

- Create: `packages/baseline-py/src/baseline_py/units/declaration.py`
- Create: `packages/baseline-py/src/baseline_py/units/collect_declarations.py`
- Create: `packages/baseline-py/src/baseline_py/units/resolve_exported_names.py`
- Create: `packages/baseline-py/src/baseline_py/units/coalesce_overloads.py`
- Create:
  `packages/baseline-py/src/baseline_py/units/coalesce_singledispatch.py`
- Create: `packages/baseline-py/src/baseline_py/units/companion_grammar.py`
- Create: `packages/baseline-py/src/baseline_py/rules/one_primary_unit.py`
- Create: `packages/baseline-py/tests/units/test_collect_declarations.py`
- Create: `packages/baseline-py/tests/rules/test_one_primary_unit.py`

**Interfaces:**

- Produces:
  - `Declaration(name: str, kind: DeclarationKind, location: Location, is_public: bool, members: tuple[Location, ...])`.
  - `collect_declarations(tree: ast.Module) -> tuple[Declaration, ...]` —
    candidates are `ClassDef`, `FunctionDef`, `AsyncFunctionDef`, PEP 695
    `TypeAlias`, `X: TypeAlias = ...`, `X = NewType(...)`. A plain
    `Alias = list[str]` is not a candidate.
  - `resolve_exported_names(tree) -> frozenset[str] | None` — the members of a
    static literal `__all__`, or `None` when absent or dynamic.
  - `coalesce_overloads(declarations) -> tuple[Declaration, ...]` — consecutive
    same-name `@overload` declarations plus exactly one implementation collapse
    into one; a malformed group stays separate and is reported.
  - `coalesce_singledispatch(declarations, tree) -> tuple[Declaration, ...]` — a
    `@<local>.register` function named `_` attaches to the local
    `@singledispatch` primary. A named handler, or a registration on an imported
    dispatcher, stays a separate declaration.
  - `is_allowed_companion(node, primary, tree) -> bool` — the companion grammar.
  - `one_primary_unit(source, config) -> tuple[Finding, ...]` — one file-level
    finding on the first offending declaration, with the others as `related`.

- [ ] **Step 1: Write the failing tests**

Cover, one test each, every row of the spec's symbol decision table: public
class/function counts; dataclass counts once; `Protocol`, ABC, `Enum`,
`TypedDict`, class `NamedTuple` each count; PEP 695 `type X = ...`,
`X: TypeAlias`, `NewType` count; plain `Alias = list[str]` does not; imports do
not; constants, a module logger, a sentinel do not; static `__all__` does not
reduce the count; an overload family counts once; a local `singledispatch` base
plus `_` handlers counts once; a named register handler counts separately; a
registration on an imported dispatcher counts separately; `@app.route` and
`@click.command` functions each count; a private `def _helper` beside a public
class is a violation; a nested function does not count; a `TYPE_CHECKING` import
block does not count; `if __name__ == "__main__": main()` does not count; a
declaration hidden under a top-level `if` is still counted; a zero-declaration
module in the `ORDINARY` role is a violation; the `DATA`, `REGISTRY`,
`ENTRYPOINT`, `TEST`, `STUB` and `GENERATED` roles behave per the role table.

- [ ] **Step 2: Run and watch them fail**

Run: `uv run pytest tests/units tests/rules/test_one_primary_unit.py -v`

- [ ] **Step 3: Implement the pipeline**

Follow the spec's nine-step decision procedure exactly, in that order. Each of
the six modules holds one primary declaration, so the rule module itself only
sequences them.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Dogfood**

Run: `uv run baseline-py check src` inside the package. It must report zero
`BPY001` findings against its own source.

- [ ] **Step 6: Commit**

```bash
git add packages/baseline-py/src/baseline_py/units packages/baseline-py/src/baseline_py/rules/one_primary_unit.py packages/baseline-py/tests/units packages/baseline-py/tests/rules/test_one_primary_unit.py
git commit -m "feat(baseline-py): enforce one primary declaration per ordinary module"
```

---

### Task 11: BPY002 file-matches-unit

**Files:**

- Create: `packages/baseline-py/src/baseline_py/units/to_snake_case.py`
- Create: `packages/baseline-py/src/baseline_py/rules/file_matches_unit.py`
- Create: `packages/baseline-py/tests/units/test_to_snake_case.py`
- Create: `packages/baseline-py/tests/rules/test_file_matches_unit.py`

**Interfaces:**

- Produces:
  - `to_snake_case(name: str) -> str` — the single documented algorithm.
  - `file_matches_unit(source, config, declarations) -> tuple[Finding, ...]`.

- [ ] **Step 1: Write the failing fixture table test**

```python
import pytest

from baseline_py.units.to_snake_case import to_snake_case

CASES = [
    ("UserRepository", "user_repository"),
    ("HTTP2Client", "http2_client"),
    ("OAuthClient", "oauth_client"),
    ("IPv6Address", "ipv6_address"),
    ("Parser", "parser"),
    ("parse_source", "parse_source"),
    ("APIKey", "api_key"),
    ("A", "a"),
]


@pytest.mark.parametrize(("name", "expected"), CASES)
def test_to_snake_case(name: str, expected: str) -> None:
    assert to_snake_case(name) == expected
```

- [ ] **Step 2: Run and watch it fail**
- [ ] **Step 3: Implement the algorithm and the rule**

Split on the boundary between a lower-case or digit and an upper-case letter,
and between a run of upper-case letters and a following upper-lower pair; then
lower-case. The rule applies to `ORDINARY` modules with exactly one counted
declaration, and is skipped for every other role.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/units/to_snake_case.py packages/baseline-py/src/baseline_py/rules/file_matches_unit.py packages/baseline-py/tests/units/test_to_snake_case.py packages/baseline-py/tests/rules/test_file_matches_unit.py
git commit -m "feat(baseline-py): require the file name to match its primary declaration"
```

---

### Task 12: BPY006 no-inline-sql

**Files:**

- Create: `packages/baseline-py/src/baseline_py/rules/looks_like_sql.py`
- Create: `packages/baseline-py/src/baseline_py/rules/no_inline_sql.py`
- Create: `packages/baseline-py/tests/rules/test_no_inline_sql.py`

**Interfaces:**

- Produces:
  - `looks_like_sql(text: str) -> bool` — normalises whitespace and requires a
    SQL-shaped token sequence: `SELECT ... FROM`, `INSERT ... INTO`,
    `UPDATE ... SET`, `DELETE ... FROM`, or `CREATE|ALTER|DROP` followed by
    `TABLE|INDEX|VIEW|TRIGGER`.
  - `no_inline_sql(source, config) -> tuple[Finding, ...]`.

- [ ] **Step 1: Write the failing tests**

```python
def test_prose_containing_select_is_not_sql() -> None:
    assert not looks_like_sql("Select an option from the menu below")


def test_a_real_query_is_sql() -> None:
    assert looks_like_sql("SELECT id, name FROM users WHERE id = ?")


def test_case_and_whitespace_are_normalised() -> None:
    assert looks_like_sql("select\n  id\nfrom\n  users")


def test_an_fstring_query_is_reported() -> None: ...
def test_implicitly_concatenated_parts_are_joined_before_matching() -> None: ...
def test_a_docstring_is_never_reported() -> None: ...
def test_ddl_is_reported() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the rule**

Walk `Constant` and `JoinedStr` nodes, skipping the docstring spans computed in
Task 7. For a `JoinedStr`, concatenate its literal parts with a placeholder for
each `FormattedValue`. Python has already merged implicit concatenation at parse
time, so no extra handling is needed there; assert that with a test.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/rules/looks_like_sql.py packages/baseline-py/src/baseline_py/rules/no_inline_sql.py packages/baseline-py/tests/rules/test_no_inline_sql.py
git commit -m "feat(baseline-py): detect inline SQL by token shape, not substring"
```

---

### Task 13: Suppressions

**Files:**

- Create: `packages/baseline-py/src/baseline_py/suppression/suppression.py`
- Create:
  `packages/baseline-py/src/baseline_py/suppression/parse_suppressions.py`
- Create:
  `packages/baseline-py/src/baseline_py/suppression/apply_suppressions.py`
- Create: `packages/baseline-py/tests/suppression/test_apply_suppressions.py`

**Interfaces:**

- Produces:
  - `Suppression(code: RuleCode, line: int | None, reason: str | None)` —
    `line is None` means file-wide.
  - `parse_suppressions(text: str) -> tuple[Suppression, ...]` — reads
    `# baseline-py: ignore[BPY006]` on a statement line and
    `# baseline-py: ignore-file[BPY001] reason: ...` on the first code line.
  - `apply_suppressions(findings, suppressions, overrides) -> tuple[tuple[Finding, ...], tuple[str, ...]]`
    — returns the surviving findings and warnings for unused or malformed
    suppressions.

- [ ] **Step 1: Write the failing tests**

```python
def test_an_inline_ignore_suppresses_that_line_only() -> None: ...
def test_ignore_file_requires_a_reason() -> None: ...
def test_an_unused_suppression_is_warned_about() -> None: ...
def test_a_malformed_code_is_warned_about() -> None: ...
def test_suppressions_never_hide_bpy000() -> None: ...
def test_path_overrides_disable_the_listed_codes() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement suppression handling**

`BPY000` and configuration errors are never suppressible. Precedence:
configuration overrides, then file-wide suppression, then inline.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/suppression packages/baseline-py/tests/suppression
git commit -m "feat(baseline-py): scope inline and path suppressions to policy findings"
```

---

### Task 14: Reporting and exit codes

**Files:**

- Create: `packages/baseline-py/src/baseline_py/report/exit_code.py`
- Create: `packages/baseline-py/src/baseline_py/report/render_text_report.py`
- Create: `packages/baseline-py/src/baseline_py/report/render_json_report.py`
- Create: `packages/baseline-py/tests/report/test_render_json_report.py`
- Create: `packages/baseline-py/tests/report/test_render_text_report.py`

**Interfaces:**

- Produces:
  - `ExitCode` — `IntEnum`: `OK = 0`, `FINDINGS = 1`, `CONFIGURATION = 2`,
    `INFRASTRUCTURE = 3`.
  - `render_text_report(findings, roots, excluded_count) -> str` — one line per
    finding, `path:line:column: BPYNNN slug: message`, then a summary naming the
    scanned roots.
  - `render_json_report(findings, metadata) -> str` — the frozen document:
    `{"schema_version": 1, "tool": {"name", "version"}, "roots": [...], "excluded_paths": n, "findings": [...], "summary": {...}}`,
    sorted, on stdout alone.

- [ ] **Step 1: Write the failing tests**

Assert the exact JSON keys, that findings are sorted by path then location then
code, that every finding carries `code`, `slug`, `severity`, `message`, `path`,
`line`, `column`, `subject`, `related`, `baseline_state` and `fingerprint`, and
that the golden text output matches a fixture.

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the renderers**
- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/report packages/baseline-py/tests/report
git commit -m "feat(baseline-py): freeze the JSON document and the four exit codes"
```

---

### Task 15: Baseline persistence

**Files:**

- Create: `packages/baseline-py/src/baseline_py/baseline/fingerprint.py`
- Create: `packages/baseline-py/src/baseline_py/baseline/baseline_file.py`
- Create: `packages/baseline-py/src/baseline_py/baseline/read_baseline.py`
- Create: `packages/baseline-py/src/baseline_py/baseline/write_baseline.py`
- Create: `packages/baseline-py/src/baseline_py/baseline/classify_findings.py`
- Create: `packages/baseline-py/tests/baseline/test_classify_findings.py`

**Interfaces:**

- Produces:
  - `fingerprint(finding: Finding, context_hash: str) -> str` — SHA-256 over
    `(code, relative path, subject or context hash)`, never the line number or
    the full message.
  - `BaselineFile(schema_version, tool_version, config_digest, entries)`.
  - `read_baseline(path) -> BaselineFile`, `write_baseline(path, file) -> None`
    (atomic, deterministic ordering).
  - `classify_findings(findings, baseline) -> tuple[new, known, resolved]`.

- [ ] **Step 1: Write the failing tests**

```python
def test_inserting_a_line_does_not_make_a_finding_new() -> None: ...
def test_a_genuinely_new_query_is_new() -> None: ...
def test_a_baseline_entry_without_a_current_finding_is_resolved() -> None: ...
def test_an_incompatible_schema_version_raises_config_error() -> None: ...
def test_editing_a_file_does_not_forgive_its_other_findings() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement persistence**

The context hash for a finding without a declaration subject is the SHA-256 of
the normalised source of the offending node, so an inserted line above it does
not change the fingerprint.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/baseline packages/baseline-py/tests/baseline
git commit -m "feat(baseline-py): fingerprint baseline entries by content, not line number"
```

---

### Task 16: The `check` and `baseline` commands

**Files:**

- Create: `packages/baseline-py/src/baseline_py/commands/check_command.py`
- Create: `packages/baseline-py/src/baseline_py/commands/baseline_command.py`
- Create: `packages/baseline-py/src/baseline_py/engine/run_rules.py`
- Create: `packages/baseline-py/src/baseline_py/engine/check_project.py`
- Modify: `packages/baseline-py/src/baseline_py/cli.py`
- Create: `packages/baseline-py/tests/commands/test_check_command.py`

**Interfaces:**

- Produces:
  - `check_project(project_root: Path, config: BaselineConfig) -> CheckResult` —
    traverses, assigns roles, parses, runs every applicable rule, applies
    suppressions and the baseline, and returns findings plus metadata.
  - `check_command` and `baseline_command` — click commands registered on `cli`.

- [ ] **Step 1: Write the failing end-to-end tests**

```python
def test_check_exits_1_on_a_violation(tmp_path) -> None: ...
def test_check_exits_0_on_a_clean_tree(tmp_path) -> None: ...
def test_check_exits_2_on_a_bad_config(tmp_path) -> None: ...
def test_check_exits_3_when_a_file_cannot_be_read(tmp_path) -> None: ...
def test_check_never_writes_a_baseline(tmp_path) -> None: ...
def test_json_output_is_valid_json_on_stdout(tmp_path) -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Wire the commands**
- [ ] **Step 4: Run the whole suite**

Run: `uv run pytest -v`

- [ ] **Step 5: Dogfood the package on itself**

Run: `uv run baseline-py check` Expected: exit 0 against
`packages/baseline-py/src`.

- [ ] **Step 6: Commit**

```bash
git add packages/baseline-py/src/baseline_py/commands packages/baseline-py/src/baseline_py/engine packages/baseline-py/src/baseline_py/cli.py packages/baseline-py/tests/commands
git commit -m "feat(baseline-py): add the read-only check command and baseline subcommands"
```

---

### Task 17: Scaffolded assets

**Files:**

- Create: `packages/baseline-py/src/baseline_py/assets/ruff.toml`
- Create: `packages/baseline-py/src/baseline_py/assets/mypy.ini`
- Create: `packages/baseline-py/src/baseline_py/assets/baseline-py.toml`
- Create: `packages/baseline-py/src/baseline_py/assets/pyproject-sections.toml`
- Create: `packages/baseline-py/src/baseline_py/assets/importlinter.ini`
- Create: `packages/baseline-py/src/baseline_py/assets/baseline-py-ci.yml`
- Create: `packages/baseline-py/tests/assets/test_assets_are_valid.py`
- Modify: `packages/baseline-py/pyproject.toml` (ship the assets as package
  data)

**Interfaces:**

- Produces: `baseline_py.assets` as an `importlib.resources` package.

- [ ] **Step 1: Write the failing test**

```python
def test_every_shipped_asset_parses() -> None: ...
def test_the_ruff_asset_names_no_all_selector() -> None: ...
def test_the_ci_asset_runs_the_gate() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Write the assets**

`ruff.toml` selects
`E, W, F, I, N, UP, B, A, C4, DTZ, T20, SIM, RET, ARG, PTH, ERA, PL, RUF, D`
plus the curated `S` subset, never `ALL`, and keeps the formatter-conflicting
rules in a named ignore list. `mypy.ini` sets `strict = true`.
`pyproject-sections.toml` carries the `[tool.deptry]`,
`[tool.pytest.ini_options]`, `[tool.coverage.report]` and
`[dependency-groups] quality` fragments that `init` merges. `baseline-py-ci.yml`
runs `uv lock --check`, `uv sync --locked`, then `baseline-py gate`, over the
minimum and latest Python.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/assets packages/baseline-py/tests/assets packages/baseline-py/pyproject.toml
git commit -m "feat(baseline-py): ship the scaffolded ruff, mypy, deptry and CI assets"
```

---

### Task 18: The `init` command

**Files:**

- Create: `packages/baseline-py/src/baseline_py/init/managed_file.py`
- Create: `packages/baseline-py/src/baseline_py/init/plan_disposition.py`
- Create: `packages/baseline-py/src/baseline_py/init/merge_ruff_config.py`
- Create:
  `packages/baseline-py/src/baseline_py/init/merge_pyproject_sections.py`
- Create: `packages/baseline-py/src/baseline_py/init/plan_init.py`
- Create: `packages/baseline-py/src/baseline_py/init/apply_init.py`
- Create: `packages/baseline-py/src/baseline_py/commands/init_command.py`
- Create: `packages/baseline-py/tests/init/test_plan_init.py`
- Create: `packages/baseline-py/tests/init/test_merge_ruff_config.py`

**Interfaces:**

- Produces:
  - `PlanDisposition` — `StrEnum`: `CREATE`, `MERGE`, `CONFLICT`, `UNCHANGED`.
  - `plan_init(project_root, profile) -> tuple[ManagedFile, ...]` — pure, reads
    only.
  - `apply_init(plan, force: bool) -> tuple[ManagedFile, ...]`.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_project_with_tool_ruff_gets_a_merge_not_a_create(tmp_path) -> None:
    """The estate case: writing ruff.toml would shadow [tool.ruff]."""


def test_merging_preserves_existing_selects_ignores_and_comments(tmp_path) -> None: ...
def test_plan_mode_writes_nothing(tmp_path) -> None: ...
def test_a_conflicting_managed_file_is_not_overwritten_without_force(tmp_path) -> None: ...
def test_existing_mypy_and_pytest_cov_are_reported_as_present(tmp_path) -> None: ...
def test_init_adds_the_quality_dependency_group(tmp_path) -> None: ...
def test_check_mode_exits_2_on_conflict(tmp_path) -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement init**

Use `tomlkit` throughout so comments and key order survive. Never write a
standalone `ruff.toml` into a project that already has `[tool.ruff]`.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Verify against real copies of the estate**

```bash
for repo in atrium mempalace djplayerdeluxe; do
  rm -rf /tmp/init-$repo && cp -R ~/p/$repo /tmp/init-$repo
  uv run baseline-py init --check --project /tmp/init-$repo
done
```

Expected: ruff reported as `merge` in all three, never `create`; mempalace
reports mypy and pytest-cov as already present.

- [ ] **Step 6: Commit**

```bash
git add packages/baseline-py/src/baseline_py/init packages/baseline-py/src/baseline_py/commands/init_command.py packages/baseline-py/tests/init
git commit -m "feat(baseline-py): scaffold configuration by merging, never shadowing"
```

---

### Task 19: The `gate` command

**Files:**

- Create: `packages/baseline-py/src/baseline_py/gate/stage.py`
- Create: `packages/baseline-py/src/baseline_py/gate/stage_status.py`
- Create: `packages/baseline-py/src/baseline_py/gate/gate_stages.py`
- Create: `packages/baseline-py/src/baseline_py/gate/run_stage.py`
- Create: `packages/baseline-py/src/baseline_py/gate/run_gate.py`
- Create: `packages/baseline-py/src/baseline_py/commands/gate_command.py`
- Create: `packages/baseline-py/tests/gate/test_run_gate.py`

**Interfaces:**

- Produces:
  - `StageStatus` — `PASSED`, `FINDINGS`, `FAILED_TO_RUN`,
    `SKIPPED_NOT_APPLICABLE`.
  - `Stage(name, required, command, artifact)`.
  - `GATE_STAGES` — ruff check, ruff format check, mypy, `baseline-py check`,
    deptry, pip-audit (`--locked .`), pytest with
    `--cov=<import-package> --cov-report=term-missing --cov-fail-under=<n>`, and
    the pyrefly shadow stage.
  - `run_gate(config, fail_fast: bool) -> GateResult`.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_missing_required_tool_exits_3_not_0() -> None: ...
def test_a_missing_shadow_tool_does_not_fail_the_gate() -> None: ...
def test_every_stage_runs_by_default() -> None: ...
def test_fail_fast_stops_at_the_first_failure() -> None: ...
def test_the_json_summary_names_each_stage_status_and_version() -> None: ...
def test_coverage_is_collected_not_merely_configured() -> None: ...
```

- [ ] **Step 2: Run and watch them fail**
- [ ] **Step 3: Implement the runner**

Resolve each tool with `shutil.which` before running. Absent required tool -
`FAILED_TO_RUN` and exit 3. Record version, duration and exit code per stage.

- [ ] **Step 4: Run the tests**
- [ ] **Step 5: Commit**

```bash
git add packages/baseline-py/src/baseline_py/gate packages/baseline-py/src/baseline_py/commands/gate_command.py packages/baseline-py/tests/gate
git commit -m "feat(baseline-py): run the full quality chain and fail on absent required tools"
```

---

### Task 20: The `python-package` template

**Files:**

- Create: `templates/python-package/` (pyproject, `src/`, `tests/`, assets, CI)
- Create: `packages/baseline-py/tests/template/test_template_gate.py`
- Modify: `templates/README.md`

- [ ] **Step 1: Write the failing template test**

The test renders the template into `tmp_path`, runs `uv lock`, `uv sync`,
`baseline-py gate`, `uv build`, then installs the built wheel into a clean
environment and imports the package. Checking the template source in place would
miss invalid generated TOML, missing package data and a broken entry point.

- [ ] **Step 2: Run and watch it fail**
- [ ] **Step 3: Write the template**

`src/` layout, one example module holding one primary declaration, one test, the
full asset set, the CI workflow, a committed `uv.lock`.

- [ ] **Step 4: Run the test**
- [ ] **Step 5: Commit**

```bash
git add templates/python-package templates/README.md packages/baseline-py/tests/template
git commit -m "feat(templates): add the python-package template on the baseline"
```

---

### Task 21: Estate report, read-only

**Files:**

- Create: `docs/reports/2026-08-31-python-estate-baseline.md`

- [ ] **Step 1: Run the checker over the five repositories**

```bash
for repo in ~/p/mem ~/p/mempalace ~/p/djplayerdeluxe \
            ~/p/esp32-amoled/agentmeter ~/p/esp32-amoled/clawd-pet; do
  uv run --project packages/baseline-py baseline-py check \
    --project "$repo" --format json > "/tmp/$(basename "$repo").json"
done
```

- [ ] **Step 2: Verify nothing changed in any of the five repos**

```bash
for repo in ~/p/mem ~/p/mempalace ~/p/djplayerdeluxe \
            ~/p/esp32-amoled/agentmeter ~/p/esp32-amoled/clawd-pet; do
  git -C "$repo" status --short
done
```

Expected: empty output for every repository. The estate pass is read-only;
adoption is a separate, individually reviewed change per repo.

- [ ] **Step 3: Write the report**

Findings per rule per repository, the observed distribution of file lengths (to
settle whether 150 is the right Python default), and the roles each repository
would need. No repository is modified.

- [ ] **Step 4: Commit**

```bash
git add docs/reports/2026-08-31-python-estate-baseline.md
git commit -m "docs(reports): record the read-only Python estate baseline pass"
```

---

### Task 22: Repository integration and release

**Files:**

- Create: `.github/workflows/publish-python.yml`
- Create: `packages/baseline-py/CHANGELOG.md`
- Modify: `CLAUDE.md` (the Python publish path)
- Modify: `README.md` (the package table)
- Modify: `scripts/release-check.mjs` (recognise the Python package)

- [ ] **Step 1: Write the publish workflow**

`workflow_dispatch` only, `id-token: write`, uv build, then
`pypa/gh-action-pypi-publish` with trusted publishing. No token anywhere.

- [ ] **Step 2: Verify the repository checks still pass**

Run: `pnpm check:ci` Expected: PASS. The Python package must not break the pnpm
workspace, turbo or knip.

- [ ] **Step 3: Document the Python publish path in `CLAUDE.md`**

State that the Python package publishes through
`gh workflow run publish-python.yml`, that PyPI trusted publishing needs an
entry naming organization `BusiRocket`, repository `baseline`, workflow
`publish-python.yml`, no environment, and that `pip login` / `twine` are never
part of the flow.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/publish-python.yml packages/baseline-py/CHANGELOG.md CLAUDE.md README.md scripts/release-check.mjs
git commit -m "chore(baseline-py): wire the package into the repo checks and PyPI publishing"
```

- [ ] **Step 5: Publish and verify**

```bash
gh workflow run publish-python.yml
gh run watch
uv run --with busirocket-baseline-py --no-project baseline-py --version
```

Expected: the released version is reported from a clean environment.

---

## Self-review

**Spec coverage.** Every spec section maps to a task: shape and distribution (1,
22), commands (16, 18, 19), the six rules (7-12), roles (5), the decision
procedure (10), configuration (3), traversal (4), diagnostics and exit codes
(14), baseline semantics (15), suppressions (13), scaffolded assets (17), type
checking (17, 19), the template (20), rollout (10, 18, 20, 21, 22).

**Deferred deliberately.** The tips subsystem is cut from v1 by the spec.
`vulture` and `jscpd` are advisory and are not wired into `gate` in v1;
`import-linter` ships as an asset for `--profile app` only.

**Type consistency.** `Finding`, `Location`, `RuleCode`, `Severity`,
`ModuleRole`, `BaselineConfig`, `SourceFile`, `Declaration`, `Stage` and
`StageStatus` are each defined once, in the task named in their `Produces`
block, and referenced by the same name everywhere after.
