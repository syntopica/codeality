# cargo-baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `cargo-baseline`, a syn-based structural linter + config scaffolder that enforces the TypeScript-baseline discipline (atomic files, placement, size caps, no inline SQL) on Rust projects, ready to apply to `~/p/project-after`.

**Architecture:** A single Rust crate at `packages/cargo-baseline` exposing a cargo subcommand with `check` (parse all `.rs` with syn on stable, run structural rules + advisory tips, ESLint-style diagnostics, non-zero exit on errors) and `init` (scaffold `baseline.toml`, `clippy.toml`, `rustfmt.toml`, `deny.toml`, toolchain + CI files). Rules are small objects implementing one `Rule` trait; the crate dogfoods its own rules.

**Tech Stack:** Rust stable (edition 2024), syn 2 (`full`, `visit`), proc-macro2 (`span-locations`), clap 4 (derive), serde + toml, walkdir, regex.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-23-rust-baseline-design.md` — every rule name and threshold comes from there.
- Defaults (verbatim from spec): `max_file_lines = 150`, `max_trait_methods = 12`, function cap 50 / args 4 / cognitive-complexity 10 (clippy.toml), crate split thresholds 75 files / 8,000 lines.
- Diagnostics format: `path:line: error[rule-name]: message` (tips: `tip[tip-name]`). Tips NEVER affect exit code.
- Test exemption: items inside `#[cfg(test)]` modules and files under `tests/` are exempt from `one-primary-unit`, `file-matches-item`, `max-file-lines`.
- The crate MUST pass its own `cargo baseline check` (dogfood) — structure all source atomically from the start: one primary item per file, inline `#[cfg(test)] mod tests` allowed.
- All code, docs, commit messages in English. No AI attribution in commits.
- Commit after every task. Run `cargo test -p cargo-baseline` before every commit.
- The pnpm monorepo files (modified `package.json`s in git status) are unrelated — never stage them.

---

### Task 1: Crate scaffold + root Cargo workspace + CLI skeleton

**Files:**
- Create: `Cargo.toml` (repo root)
- Create: `packages/cargo-baseline/Cargo.toml`
- Create: `packages/cargo-baseline/src/main.rs`
- Create: `packages/cargo-baseline/src/cli.rs`
- Modify: `.gitignore` (add `target/`)

**Interfaces:**
- Produces: `Cli` enum (clap) with `Check { path: PathBuf }` and `Init { path: PathBuf, ci: bool }`; `main` dispatches to `commands::check::run` / `commands::init::run` (stubs return `Ok(())` until Tasks 12/13).

- [ ] **Step 1: Root workspace file**

```toml
# Cargo.toml (repo root)
[workspace]
resolver = "3"
members = ["packages/cargo-baseline"]
```

- [ ] **Step 2: Crate manifest**

```toml
# packages/cargo-baseline/Cargo.toml
[package]
name = "cargo-baseline"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
description = "Structural linter and config scaffolder: atomic files, placement, size caps, no inline SQL"
license = "MIT"
repository = "https://github.com/BusiRocket/baseline"

[dependencies]
anyhow = "1"
clap = { version = "4", features = ["derive"] }
proc-macro2 = { version = "1", features = ["span-locations"] }
regex = "1"
serde = { version = "1", features = ["derive"] }
syn = { version = "2", features = ["full", "visit", "parsing", "printing"] }
toml = "0.8"
walkdir = "2"

[lints.clippy]
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
```

- [ ] **Step 3: CLI definition**

```rust
// src/cli.rs
use std::path::PathBuf;

use clap::{Parser, Subcommand};

/// `cargo baseline` — invoked as a cargo subcommand, so the first
/// user-visible arg is the literal word `baseline`.
#[derive(Parser)]
#[command(name = "cargo-baseline", bin_name = "cargo")]
pub enum Cli {
    #[command(subcommand)]
    Baseline(BaselineCommand),
}

#[derive(Subcommand)]
pub enum BaselineCommand {
    /// Run structural rules and tips over a crate or workspace
    Check {
        #[arg(default_value = ".")]
        path: PathBuf,
    },
    /// Scaffold baseline.toml, clippy.toml, rustfmt.toml, deny.toml, toolchain
    Init {
        #[arg(default_value = ".")]
        path: PathBuf,
        /// Also write a GitHub Actions workflow
        #[arg(long)]
        ci: bool,
    },
}
```

```rust
// src/main.rs
mod cli;
mod commands;
mod config;
mod engine;
mod rules;
mod tips;

use clap::Parser;

fn main() -> anyhow::Result<()> {
    let cli::Cli::Baseline(cmd) = cli::Cli::parse();
    match cmd {
        cli::BaselineCommand::Check { path } => commands::check::run(&path),
        cli::BaselineCommand::Init { path, ci } => commands::init::run(&path, ci),
    }
}
```

Create stub modules so it compiles: `src/commands/mod.rs` (`pub mod check; pub mod init;`), `src/commands/check.rs` and `src/commands/init.rs` each with a stub (`pub fn run(...) -> anyhow::Result<()> { Ok(()) }`; init takes `(&Path, bool)`), and empty `src/config/mod.rs`, `src/engine/mod.rs`, `src/rules/mod.rs`, `src/tips/mod.rs`.

- [ ] **Step 4: Verify**

Run: `cargo run -p cargo-baseline -- baseline check --help`
Expected: help text for `check` with `PATH` default `.`.

- [ ] **Step 5: Commit**

```bash
git add Cargo.toml Cargo.lock packages/cargo-baseline .gitignore
git commit -m "feat(cargo-baseline): scaffold crate and CLI skeleton"
```

---

### Task 2: Engine core — Diagnostic, Severity, FileContext, Rule trait, file walker

**Files:**
- Create: `packages/cargo-baseline/src/engine/mod.rs`
- Create: `packages/cargo-baseline/src/engine/severity.rs`
- Create: `packages/cargo-baseline/src/engine/diagnostic.rs`
- Create: `packages/cargo-baseline/src/engine/file_context.rs`
- Create: `packages/cargo-baseline/src/engine/rule.rs`
- Create: `packages/cargo-baseline/src/engine/collect_rust_files.rs`
- Create: `packages/cargo-baseline/src/engine/is_cfg_test_item.rs`

**Interfaces:**
- Produces (all rules and commands depend on these exact signatures):
  - `Severity { Error, Tip }`
  - `Diagnostic { path: PathBuf, line: usize, rule: &'static str, severity: Severity, message: String }` + `impl Display` rendering `path:line: error[rule]: message` (or `tip[...]`)
  - `FileContext { path: PathBuf, source: String, ast: syn::File }` + `FileContext::parse(path, source) -> anyhow::Result<Self>`
  - `trait Rule { fn name(&self) -> &'static str; fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic>; }`
  - `collect_rust_files(src_dir: &Path) -> Vec<PathBuf>` (recursive, `.rs` only, skips `target/`)
  - `is_cfg_test_item(attrs: &[syn::Attribute]) -> bool` (true for `#[cfg(test)]`)
- Consumes: `BaselineConfig` — forward-declare in Task 3; for this task use a placeholder `pub struct BaselineConfig;` in `src/config/mod.rs` replaced in Task 3.

- [ ] **Step 1: Write tests (inline `#[cfg(test)]` in each file)**

```rust
// in diagnostic.rs
#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::severity::Severity;

    #[test]
    fn renders_eslint_style_line() {
        let d = Diagnostic {
            path: "src/store.rs".into(),
            line: 42,
            rule: "max-file-lines",
            severity: Severity::Error,
            message: "file has 300 lines (max 150)".into(),
        };
        assert_eq!(
            d.to_string(),
            "src/store.rs:42: error[max-file-lines]: file has 300 lines (max 150)"
        );
    }
}
```

```rust
// in is_cfg_test_item.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_cfg_test() {
        let m: syn::ItemMod = syn::parse_quote! { #[cfg(test)] mod tests {} };
        assert!(is_cfg_test_item(&m.attrs));
        let m: syn::ItemMod = syn::parse_quote! { mod plain {} };
        assert!(!is_cfg_test_item(&m.attrs));
    }
}
```

- [ ] **Step 2: Run tests, verify failure (types missing)**

Run: `cargo test -p cargo-baseline`
Expected: compile error — types not defined yet.

- [ ] **Step 3: Implement**

```rust
// severity.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Tip,
}
```

```rust
// diagnostic.rs
use std::fmt;
use std::path::PathBuf;

use crate::engine::severity::Severity;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub path: PathBuf,
    pub line: usize,
    pub rule: &'static str,
    pub severity: Severity,
    pub message: String,
}

impl fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let kind = match self.severity {
            Severity::Error => "error",
            Severity::Tip => "tip",
        };
        write!(
            f,
            "{}:{}: {kind}[{}]: {}",
            self.path.display(),
            self.line,
            self.rule,
            self.message
        )
    }
}
```

```rust
// file_context.rs
use std::path::{Path, PathBuf};

use anyhow::Context;

pub struct FileContext {
    pub path: PathBuf,
    pub source: String,
    pub ast: syn::File,
}

impl FileContext {
    pub fn parse(path: &Path, source: String) -> anyhow::Result<Self> {
        let ast = syn::parse_file(&source)
            .with_context(|| format!("failed to parse {}", path.display()))?;
        Ok(Self { path: path.to_path_buf(), source, ast })
    }
}
```

```rust
// rule.rs
use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;

pub trait Rule {
    fn name(&self) -> &'static str;
    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic>;
}
```

```rust
// collect_rust_files.rs
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

pub fn collect_rust_files(src_dir: &Path) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = WalkDir::new(src_dir)
        .into_iter()
        .filter_entry(|e| e.file_name() != "target")
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().is_some_and(|x| x == "rs"))
        .map(|e| e.into_path())
        .collect();
    files.sort();
    files
}
```

```rust
// is_cfg_test_item.rs
pub fn is_cfg_test_item(attrs: &[syn::Attribute]) -> bool {
    attrs.iter().any(|a| {
        a.path().is_ident("cfg")
            && a.parse_args::<syn::Ident>().is_ok_and(|i| i == "test")
    })
}
```

`engine/mod.rs` declares all seven modules (`pub mod ...`). `config/mod.rs` gets placeholder `pub struct BaselineConfig;`.

- [ ] **Step 4: Run tests, verify pass**

Run: `cargo test -p cargo-baseline`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cargo-baseline
git commit -m "feat(cargo-baseline): engine core types and file walker"
```

---

### Task 3: BaselineConfig — defaults + `baseline.toml` loading

**Files:**
- Create: `packages/cargo-baseline/src/config/baseline_config.rs`
- Modify: `packages/cargo-baseline/src/config/mod.rs` (replace placeholder with `mod baseline_config; pub use baseline_config::BaselineConfig;`)

**Interfaces:**
- Produces (exact field names — every rule reads these):

```rust
pub struct BaselineConfig {
    pub max_file_lines: usize,      // 150
    pub max_trait_methods: usize,   // 12
    pub crate_max_files: usize,     // 75
    pub crate_max_lines: usize,     // 8000
    pub unwrap_density: usize,      // 10
    pub disabled_rules: Vec<String>,
    pub disabled_tips: Vec<String>,
}
```
- `BaselineConfig::default()` with the values above; `BaselineConfig::load(dir: &Path) -> anyhow::Result<Self>` reads `<dir>/baseline.toml` if present (serde `#[serde(default)]` per field so a partial file works), else defaults.

- [ ] **Step 1: Write failing test** (inline in `baseline_config.rs`)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_match_spec() {
        let c = BaselineConfig::default();
        assert_eq!(c.max_file_lines, 150);
        assert_eq!(c.max_trait_methods, 12);
        assert_eq!(c.crate_max_files, 75);
        assert_eq!(c.crate_max_lines, 8000);
    }

    #[test]
    fn loads_partial_toml() {
        let dir = std::env::temp_dir().join("baseline-cfg-test");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("baseline.toml"), "max_file_lines = 200\n").unwrap();
        let c = BaselineConfig::load(&dir).unwrap();
        assert_eq!(c.max_file_lines, 200);
        assert_eq!(c.max_trait_methods, 12);
    }
}
```

Note: `unwrap()` in tests is fine — add `#![cfg_attr(test, allow(clippy::unwrap_used))]`? No: crate-level lint config in Cargo.toml denies it globally; instead add `#[allow(clippy::unwrap_used)]` on each `mod tests`. Use that pattern in ALL test modules in this crate.

- [ ] **Step 2: Run, verify compile failure** — `cargo test -p cargo-baseline`

- [ ] **Step 3: Implement**

```rust
use std::path::Path;

use anyhow::Context;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct BaselineConfig {
    pub max_file_lines: usize,
    pub max_trait_methods: usize,
    pub crate_max_files: usize,
    pub crate_max_lines: usize,
    pub unwrap_density: usize,
    pub disabled_rules: Vec<String>,
    pub disabled_tips: Vec<String>,
}

impl Default for BaselineConfig {
    fn default() -> Self {
        Self {
            max_file_lines: 150,
            max_trait_methods: 12,
            crate_max_files: 75,
            crate_max_lines: 8000,
            unwrap_density: 10,
            disabled_rules: Vec::new(),
            disabled_tips: Vec::new(),
        }
    }
}

impl BaselineConfig {
    pub fn load(dir: &Path) -> anyhow::Result<Self> {
        let path = dir.join("baseline.toml");
        if !path.exists() {
            return Ok(Self::default());
        }
        let text = std::fs::read_to_string(&path)
            .with_context(|| format!("reading {}", path.display()))?;
        toml::from_str(&text).with_context(|| format!("parsing {}", path.display()))
    }
}
```

- [ ] **Step 4: Run tests, verify pass** — `cargo test -p cargo-baseline`

- [ ] **Step 5: Commit** — `git add packages/cargo-baseline && git commit -m "feat(cargo-baseline): baseline.toml config with spec defaults"`

---

### Task 4: Rule `max-file-lines`

**Files:**
- Create: `packages/cargo-baseline/src/rules/max_file_lines.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs` (`pub mod max_file_lines;`)

**Interfaces:**
- Produces: `pub struct MaxFileLines;` implementing `Rule` (name `"max-file-lines"`).
- Counts lines that are neither blank nor comment-only (line starting with `//` after trim; lines inside `/* */` blocks skipped with a simple depth counter). Emits one Diagnostic at line 1 when count > `cfg.max_file_lines`. Skips files whose path contains a `tests` directory component (walker already only feeds `src/`, but keep the guard).

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    fn ctx(src: &str) -> FileContext {
        FileContext::parse(std::path::Path::new("src/x.rs"), src.into()).unwrap()
    }

    #[test]
    fn flags_file_over_limit() {
        let body = "fn a() {}\n".repeat(200);
        let cfg = BaselineConfig::default();
        let d = MaxFileLines.check(&ctx(&body), &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "max-file-lines");
    }

    #[test]
    fn blank_and_comment_lines_do_not_count() {
        let body = format!("{}{}", "// c\n\n".repeat(200), "fn a() {}\n");
        let cfg = BaselineConfig::default();
        assert!(MaxFileLines.check(&ctx(&body), &cfg).is_empty());
    }
}
```

- [ ] **Step 2: Run, verify fail** — `cargo test -p cargo-baseline max_file_lines`

- [ ] **Step 3: Implement**

```rust
use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct MaxFileLines;

impl Rule for MaxFileLines {
    fn name(&self) -> &'static str {
        "max-file-lines"
    }

    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let mut depth = 0usize;
        let count = ctx
            .source
            .lines()
            .filter(|l| {
                let t = l.trim();
                if depth > 0 {
                    depth = depth.saturating_sub(t.matches("*/").count());
                    depth += t.matches("/*").count().saturating_sub(t.matches("*/").count()).min(0);
                    return false;
                }
                if t.starts_with("/*") {
                    depth += 1;
                    depth = depth.saturating_sub(t.matches("*/").count());
                    return false;
                }
                !(t.is_empty() || t.starts_with("//"))
            })
            .count();
        if count <= cfg.max_file_lines {
            return Vec::new();
        }
        vec![Diagnostic {
            path: ctx.path.clone(),
            line: 1,
            rule: self.name(),
            severity: Severity::Error,
            message: format!("file has {count} code lines (max {})", cfg.max_file_lines),
        }]
    }
}
```

Note for implementer: the block-comment counter above is intentionally simple; if the closure-with-mutable-state version fights the borrow checker, extract a plain `fn count_code_lines(source: &str) -> usize` loop inside the same file? NO — atomic rule bans private helpers. Write it as a plain `for` loop inside `check` instead of iterator chains.

- [ ] **Step 4: Run tests, verify pass** — `cargo test -p cargo-baseline max_file_lines`

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): max-file-lines rule"`

---

### Task 5: Rule `one-primary-unit`

**Files:**
- Create: `packages/cargo-baseline/src/rules/one_primary_unit.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct OnePrimaryUnit;` implementing `Rule` (name `"one-primary-unit"`).
- A "unit" is a top-level `Item::Fn | Item::Struct | Item::Enum | Item::Trait | Item::Type | Item::Union | Item::Macro`(macro_rules). NOT units: `use`, `mod` declarations, `impl`, `const`, `static`, `extern crate`. Items inside `#[cfg(test)]` mods don't count (use `is_cfg_test_item`). >1 unit → one Diagnostic per extra unit (line = unit's span start via `syn::spanned::Spanned` + `proc-macro2::Span::start().line`). Skip `mod.rs`, `lib.rs`, `main.rs` (barrel rule owns those).

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    fn check(src: &str) -> Vec<crate::engine::diagnostic::Diagnostic> {
        let ctx = FileContext::parse(std::path::Path::new("src/x.rs"), src.into()).unwrap();
        OnePrimaryUnit.check(&ctx, &BaselineConfig::default())
    }

    #[test]
    fn struct_plus_impls_is_one_unit() {
        let src = "pub struct A; impl A { pub fn f(&self) {} } impl std::fmt::Debug for A { fn fmt(&self, _: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { Ok(()) } }";
        assert!(check(src).is_empty());
    }

    #[test]
    fn private_helper_fn_is_flagged() {
        let src = "pub fn main_thing() {} fn helper() {}";
        let d = check(src);
        assert_eq!(d.len(), 1);
        assert!(d[0].message.contains("helper"));
    }

    #[test]
    fn cfg_test_mod_is_exempt() {
        let src = "pub fn a() {} #[cfg(test)] mod tests { fn b() {} }";
        assert!(check(src).is_empty());
    }
}
```

- [ ] **Step 2: Run, verify fail** — `cargo test -p cargo-baseline one_primary_unit`

- [ ] **Step 3: Implement**

```rust
use syn::spanned::Spanned;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct OnePrimaryUnit;

impl Rule for OnePrimaryUnit {
    fn name(&self) -> &'static str {
        "one-primary-unit"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let stem = ctx.path.file_name().and_then(|s| s.to_str()).unwrap_or("");
        if matches!(stem, "mod.rs" | "lib.rs" | "main.rs" | "build.rs") {
            return Vec::new();
        }
        let mut units: Vec<(String, usize)> = Vec::new();
        for item in &ctx.ast.items {
            let (name, attrs, span) = match item {
                syn::Item::Fn(i) => (i.sig.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Struct(i) => (i.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Enum(i) => (i.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Trait(i) => (i.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Type(i) => (i.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Union(i) => (i.ident.to_string(), &i.attrs, i.span()),
                syn::Item::Macro(i) => (
                    i.ident.as_ref().map(ToString::to_string).unwrap_or_default(),
                    &i.attrs,
                    i.span(),
                ),
                _ => continue,
            };
            if is_cfg_test_item(attrs) {
                continue;
            }
            units.push((name, span.start().line));
        }
        units
            .iter()
            .skip(1)
            .map(|(name, line)| Diagnostic {
                path: ctx.path.clone(),
                line: *line,
                rule: self.name(),
                severity: Severity::Error,
                message: format!(
                    "extra unit `{name}` — one primary item per file; extract to its own file"
                ),
            })
            .collect()
    }
}
```

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): one-primary-unit rule"`

---

### Task 6: Rule `no-inline-sql`

**Files:**
- Create: `packages/cargo-baseline/src/rules/no_inline_sql.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct NoInlineSql;` (name `"no-inline-sql"`). Visits every string literal (`syn::visit::Visit` for `syn::LitStr`, which covers raw strings) outside `#[cfg(test)]` mods; flags when the value matches case-insensitive regex `\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE|DROP\s+(TABLE|INDEX))\b` (with `(?is)` flags so multi-line SQL matches). Message: "SQL literal in .rs — move to sql/*.sql and load with include_str!".
- Build the regex with `std::sync::LazyLock<Regex>`.

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    fn check(src: &str) -> usize {
        let ctx = FileContext::parse(std::path::Path::new("src/x.rs"), src.into()).unwrap();
        NoInlineSql.check(&ctx, &BaselineConfig::default()).len()
    }

    #[test]
    fn flags_select_literal() {
        assert_eq!(check(r#"pub fn q() -> &'static str { "SELECT id FROM users WHERE x = ?1" }"#), 1);
    }

    #[test]
    fn flags_multiline_create_table() {
        assert_eq!(check("pub const S: &str = \"CREATE TABLE t (\n id INTEGER\n);\";"), 1);
    }

    #[test]
    fn ignores_plain_strings_and_include_str() {
        assert_eq!(check(r#"pub fn m() -> &'static str { "hello select something" }"#), 0);
        assert_eq!(check(r#"pub const Q: &str = include_str!("sql/get_user.sql");"#), 0);
    }
}
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement** — visitor struct implementing `syn::visit::Visit<'ast>` with `visit_lit_str` collecting `(line, ())` matches and `visit_item_mod` early-returning (not recursing) when `is_cfg_test_item(&node.attrs)`. Note `"hello select something"` must NOT match (regex requires `SELECT <cols> FROM`). Line via `lit.span().start().line`.

```rust
use std::sync::LazyLock;

use regex::Regex;
use syn::spanned::Spanned;
use syn::visit::Visit;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

static SQL: LazyLock<Regex> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)] // pattern is a compile-time constant
    Regex::new(r"(?is)\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE|DROP\s+(TABLE|INDEX))\b").unwrap()
});

pub struct NoInlineSql;

struct SqlVisitor {
    hits: Vec<usize>,
}

impl<'ast> Visit<'ast> for SqlVisitor {
    fn visit_lit_str(&mut self, lit: &'ast syn::LitStr) {
        if SQL.is_match(&lit.value()) {
            self.hits.push(lit.span().start().line);
        }
    }

    fn visit_item_mod(&mut self, m: &'ast syn::ItemMod) {
        if is_cfg_test_item(&m.attrs) {
            return;
        }
        syn::visit::visit_item_mod(self, m);
    }
}

impl Rule for NoInlineSql {
    fn name(&self) -> &'static str {
        "no-inline-sql"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let mut v = SqlVisitor { hits: Vec::new() };
        v.visit_file(&ctx.ast);
        v.hits
            .into_iter()
            .map(|line| Diagnostic {
                path: ctx.path.clone(),
                line,
                rule: self.name(),
                severity: Severity::Error,
                message: "SQL literal in .rs — move to sql/*.sql and load with include_str!".into(),
            })
            .collect()
    }
}
```

Dogfood note: `SqlVisitor` is a second item in this file. Our own `one-primary-unit` rule counts `Item::Struct` — `SqlVisitor` would be flagged. Resolution (applies to every rule needing a visitor): the visitor struct goes in its own file `src/rules/no_inline_sql_visitor.rs` exporting `SqlVisitor` (`pub(crate)`), imported by the rule file. Same pattern for later visitors.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): no-inline-sql rule"`

---

### Task 7: Rule `max-trait-methods`

**Files:**
- Create: `packages/cargo-baseline/src/rules/max_trait_methods.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct MaxTraitMethods;` (name `"max-trait-methods"`). For each top-level `Item::Trait` (not cfg(test)): count items of kind `syn::TraitItem::Fn`. If count > `cfg.max_trait_methods` emit Diagnostic at trait's line: "trait `Store` has 47 methods (max 12) — split into focused traits (interface segregation)".

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    #[test]
    fn flags_god_trait() {
        let methods: String = (0..13).map(|i| format!("fn m{i}(&self);")).collect();
        let src = format!("pub trait Store {{ {methods} }}");
        let ctx = FileContext::parse(std::path::Path::new("src/store_trait.rs"), src).unwrap();
        let d = MaxTraitMethods.check(&ctx, &BaselineConfig::default());
        assert_eq!(d.len(), 1);
        assert!(d[0].message.contains("13 methods (max 12)"));
    }

    #[test]
    fn allows_small_trait() {
        let src = "pub trait Id { fn id(&self) -> u64; }";
        let ctx = FileContext::parse(std::path::Path::new("src/id.rs"), src.into()).unwrap();
        assert!(MaxTraitMethods.check(&ctx, &BaselineConfig::default()).is_empty());
    }
}
```

- [ ] **Step 2: Run, verify fail** — then **Step 3: Implement** (iterate `ctx.ast.items`, match `Item::Trait`, skip `is_cfg_test_item`, count `TraitItem::Fn`, compare, emit). Same shape as Task 5's loop; single item `MaxTraitMethods` in file.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): max-trait-methods rule"`

---

### Task 8: Rule `barrel-only-mod`

**Files:**
- Create: `packages/cargo-baseline/src/rules/barrel_only_mod.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct BarrelOnlyMod;` (name `"barrel-only-mod"`). Applies ONLY to files named `mod.rs` or `lib.rs`. Allowed top-level items: `Item::Mod` (declaration only, `content: None`, or `#[cfg(test)]` mods with bodies), `Item::Use`, `Item::ExternCrate`. Carve-outs: in `lib.rs` one `Item::Fn` named `run` is allowed (Tauri entrypoint); `Item::Macro` calls whose path ends in `generate_handler`/`uniffi` style are NOT special-cased (v1 keeps it simple: only `run`). Everything else → Diagnostic per item: "logic in barrel file — mod.rs/lib.rs hold only mod declarations and re-exports".

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    fn check(name: &str, src: &str) -> usize {
        let ctx = FileContext::parse(std::path::Path::new(name), src.into()).unwrap();
        BarrelOnlyMod.check(&ctx, &BaselineConfig::default()).len()
    }

    #[test]
    fn clean_barrel_passes() {
        assert_eq!(check("src/store/mod.rs", "mod sqlite_store; pub use sqlite_store::SqliteStore;"), 0);
    }

    #[test]
    fn fn_in_mod_rs_flagged() {
        assert_eq!(check("src/store/mod.rs", "pub fn helper() {}"), 1);
    }

    #[test]
    fn tauri_run_allowed_in_lib_rs() {
        assert_eq!(check("src/lib.rs", "pub mod audio; pub fn run() {}"), 0);
    }

    #[test]
    fn other_fn_in_lib_rs_flagged() {
        assert_eq!(check("src/lib.rs", "pub fn greet() {}"), 1);
    }

    #[test]
    fn regular_file_ignored() {
        assert_eq!(check("src/thing.rs", "pub fn a() {} pub fn b() {}"), 0);
    }
}
```

- [ ] **Step 2: Run, verify fail** — then **Step 3: Implement**: match on file stem; loop items; allow-list match; `lib.rs` + `Item::Fn` with `sig.ident == "run"` → allowed; also allow inline `mod` with content when `is_cfg_test_item`. Emit with item span line.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): barrel-only-mod rule"`

---

### Task 9: Rule `tauri-command-placement`

**Files:**
- Create: `packages/cargo-baseline/src/rules/tauri_command_placement.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct TauriCommandPlacement;` (name `"tauri-command-placement"`). Detect top-level fns with an attribute whose path is `tauri::command` (`attr.path().segments` == ["tauri","command"]) or `command` when file already imports `tauri::command` (keep v1 simple: match full path `tauri::command` only — consumer-t uses `#[tauri::command]`, verified). If such a fn exists and the file path does NOT contain a `commands` directory component → Diagnostic: "#[tauri::command] outside commands/ — one command per file under commands/, thin wrapper delegating to domain fn".

- [ ] **Step 1: Failing test**

```rust
#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::file_context::FileContext;
    use crate::engine::rule::Rule;

    fn check(path: &str, src: &str) -> usize {
        let ctx = FileContext::parse(std::path::Path::new(path), src.into()).unwrap();
        TauriCommandPlacement.check(&ctx, &BaselineConfig::default()).len()
    }

    #[test]
    fn command_outside_commands_dir_flagged() {
        assert_eq!(check("src/lib.rs", "#[tauri::command] pub fn greet() {}"), 1);
    }

    #[test]
    fn command_inside_commands_dir_ok() {
        assert_eq!(check("src/commands/greet.rs", "#[tauri::command] pub fn greet() {}"), 0);
    }
}
```

- [ ] **Step 2–4:** Run fail → implement (iterate items, `Item::Fn`, check attrs paths, check `ctx.path.components()` for a `commands` component) → run pass.

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): tauri-command-placement rule"`

---

### Task 10: Rule `file-matches-item` (+ grab-bag ban)

**Files:**
- Create: `packages/cargo-baseline/src/rules/file_matches_item.rs`
- Create: `packages/cargo-baseline/src/rules/to_snake_case.rs`
- Modify: `packages/cargo-baseline/src/rules/mod.rs`

**Interfaces:**
- Produces: `pub struct FileMatchesItem;` (name `"file-matches-item"`) and `pub fn to_snake_case(name: &str) -> String` (own file — atomic rule; `UserRepository` → `user_repository`, already-snake stays unchanged).
- Logic: skip `mod.rs`/`lib.rs`/`main.rs`/`build.rs`. Banned stems `utils|helpers|misc|common` → Diagnostic "grab-bag file name". Else find the FIRST unit (same unit kinds as Task 5, skipping cfg(test)); if present and `to_snake_case(unit_name) != stem` → Diagnostic "file `x.rs` does not match its primary item `Y` (expected `y.rs`)". Files with zero units (pure re-export or const-only): no finding.

- [ ] **Step 1: Failing tests** — for `to_snake_case` (in its file): `assert_eq!(to_snake_case("UserRepository"), "user_repository");`, `assert_eq!(to_snake_case("build_draft_prompt"), "build_draft_prompt");`, `assert_eq!(to_snake_case("HTTPServer"), "http_server");`. For the rule: `utils.rs` flagged; `user_repository.rs` with `pub struct UserRepository` passes; `store.rs` with `pub struct SqliteStore` flagged.

- [ ] **Step 2–4:** Run fail → implement → run pass. `to_snake_case`: iterate chars, on uppercase push `_` when previous char is lowercase/digit OR next char is lowercase (handles acronym runs), push lowercased char.

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): file-matches-item rule and snake_case helper"`

---

### Task 11: Rule `lints-inheritance` + crate-level scan (`CrateInfo`)

**Files:**
- Create: `packages/cargo-baseline/src/engine/crate_info.rs`
- Create: `packages/cargo-baseline/src/rules/lints_inheritance.rs`
- Modify: `packages/cargo-baseline/src/engine/mod.rs`, `src/rules/mod.rs`

**Interfaces:**
- Produces:
  - `pub struct CrateInfo { pub root: PathBuf, pub manifest: toml::Value, pub is_workspace_root: bool, pub member_roots: Vec<PathBuf> }` with `CrateInfo::load(dir: &Path) -> anyhow::Result<Self>` (parses `Cargo.toml`; expands `workspace.members` globs manually: for each member pattern with `*`, list matching dirs containing `Cargo.toml`).
  - `pub fn check_lints_inheritance(info: &CrateInfo) -> Vec<Diagnostic>` — NOT the `Rule` trait (works on manifests, not `.rs` files): if root manifest has `workspace.lints`, every member manifest must contain `lints.workspace = true`; missing → Diagnostic (line 1 of that member's Cargo.toml, rule `"lints-inheritance"`): "member does not inherit workspace lints — add `[lints]\nworkspace = true`".

- [ ] **Step 1: Failing test** (use temp dirs, write minimal root + member Cargo.tomls, assert diagnostic present/absent).

```rust
#[test]
fn flags_member_missing_lints_inheritance() {
    let root = std::env::temp_dir().join("bl-lints-test");
    let member = root.join("crates/a");
    std::fs::create_dir_all(member.join("src")).unwrap();
    std::fs::write(root.join("Cargo.toml"),
        "[workspace]\nmembers=[\"crates/a\"]\n[workspace.lints.clippy]\nunwrap_used=\"deny\"\n").unwrap();
    std::fs::write(member.join("Cargo.toml"),
        "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n").unwrap();
    let info = CrateInfo::load(&root).unwrap();
    assert_eq!(check_lints_inheritance(&info).len(), 1);
}
```

- [ ] **Step 2–4:** Run fail → implement → run pass.

- [ ] **Step 5: Commit** — `git commit -am "feat(cargo-baseline): crate scanning and lints-inheritance rule"`

---

### Task 12: Tips engine (4 tips) + `check` command wiring

**Files:**
- Create: `packages/cargo-baseline/src/tips/rusqlite_tip.rs`
- Create: `packages/cargo-baseline/src/tips/anyhow_in_lib_tip.rs`
- Create: `packages/cargo-baseline/src/tips/unwrap_density_tip.rs`
- Create: `packages/cargo-baseline/src/tips/oversized_crate_tip.rs`
- Create: `packages/cargo-baseline/src/tips/mod.rs`
- Rewrite: `packages/cargo-baseline/src/commands/check.rs`

**Interfaces:**
- Consumes: `CrateInfo`, `BaselineConfig`, all `Rule` impls, `collect_rust_files`, `FileContext`.
- Produces — each tip is `pub fn <name>_tip(info: &CrateInfo, files: &[FileContext], cfg: &BaselineConfig) -> Vec<Diagnostic>` (Severity::Tip):
  - `rusqlite_tip`: manifest lists `rusqlite` in `[dependencies]` → tip at Cargo.toml line 1: "rusqlite detected — consider a typed data layer (sqlx compile-time-checked queries via query_file_as!, or SeaORM); hand-rolled Row→struct mappings become generated/typed code".
  - `anyhow_in_lib_tip`: crate has `src/lib.rs` AND no `src/main.rs` AND `anyhow` in `[dependencies]` → tip: "anyhow in a library crate — prefer typed errors (thiserror); keep anyhow at binary edges".
  - `unwrap_density_tip`: total count of `.unwrap()` + `.expect(` substring occurrences across non-test sources > `cfg.unwrap_density` → tip: "N unwrap()/expect() calls — consolidate errors with thiserror".
  - `oversized_crate_tip`: file count > `cfg.crate_max_files` OR total line count > `cfg.crate_max_lines` → tip: "crate has N files / M lines — consider splitting into workspace crates (crates/ flat layout)".
- `check::run(path)`: load `CrateInfo` + `BaselineConfig::load`; determine crate roots (workspace → members, else self); for each root: collect files under `src/`, parse (parse failures are reported as errors, not panics), run all 7 file rules (respect `cfg.disabled_rules` by rule name), run `check_lints_inheritance`, run tips (respect `disabled_tips`). Print all diagnostics sorted by path then line (errors first, then a blank line and tips). Summary line: `baseline: N errors, M tips`. Exit: `std::process::exit(1)` when N > 0 (return `Ok(())` otherwise).

- [ ] **Step 1: Failing integration test** — Create `packages/cargo-baseline/tests/check_integration.rs`:

```rust
use std::process::Command;

#[test]
fn check_flags_fixture_project() {
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/bad-crate");
    let out = Command::new(env!("CARGO_BIN_EXE_cargo-baseline"))
        .args(["baseline", "check"])
        .arg(&fixture)
        .output()
        .expect("binary runs");
    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(!out.status.success());
    assert!(stdout.contains("error[no-inline-sql]"));
    assert!(stdout.contains("error[one-primary-unit]"));
    assert!(stdout.contains("tip[rusqlite]"));
}
```

Create fixture `tests/fixtures/bad-crate/`: `Cargo.toml` (`[package] name="bad-crate" version="0.1.0" edition="2021"` + `[dependencies] rusqlite = "0.40"`), `src/lib.rs` (`pub mod store;`), `src/store.rs` with two pub fns, one containing `"SELECT id FROM t"`.

- [ ] **Step 2: Run, verify fail** — `cargo test -p cargo-baseline --test check_integration`

- [ ] **Step 3: Implement tips + check command.** Tip names for `disabled_tips` matching and diagnostic rule field: `"rusqlite"`, `"anyhow-in-lib"`, `"unwrap-density"`, `"oversized-crate"`. The rules registry in `check.rs`:

```rust
let rules: Vec<Box<dyn Rule>> = vec![
    Box::new(crate::rules::max_file_lines::MaxFileLines),
    Box::new(crate::rules::one_primary_unit::OnePrimaryUnit),
    Box::new(crate::rules::no_inline_sql::NoInlineSql),
    Box::new(crate::rules::max_trait_methods::MaxTraitMethods),
    Box::new(crate::rules::barrel_only_mod::BarrelOnlyMod),
    Box::new(crate::rules::tauri_command_placement::TauriCommandPlacement),
    Box::new(crate::rules::file_matches_item::FileMatchesItem),
];
```

Non-test source filter for unwrap-density: strip lines inside `#[cfg(test)]`? v1: count on whole file MINUS files under `tests/`; document imprecision in a code comment only if needed.

- [ ] **Step 4: Run all tests, verify pass** — `cargo test -p cargo-baseline`

- [ ] **Step 5: Commit** — `git add -A packages/cargo-baseline && git commit -m "feat(cargo-baseline): tips engine and check command"`

---

### Task 13: `init` command + config assets

**Files:**
- Create: `packages/cargo-baseline/assets/baseline.toml`
- Create: `packages/cargo-baseline/assets/clippy.toml`
- Create: `packages/cargo-baseline/assets/rustfmt.toml`
- Create: `packages/cargo-baseline/assets/deny.toml`
- Create: `packages/cargo-baseline/assets/rust-toolchain.toml`
- Create: `packages/cargo-baseline/assets/workspace-lints.toml`
- Create: `packages/cargo-baseline/assets/baseline-ci.yml`
- Rewrite: `packages/cargo-baseline/src/commands/init.rs`

**Interfaces:**
- Produces: `init::run(path, ci)` writes each asset (via `include_str!("../../assets/<name>")`) into the target, SKIPPING any file that already exists (print `skip: <name> (exists)`); prints a final instruction block telling the user to paste `workspace-lints.toml` content into their root `Cargo.toml` and add `[lints] workspace = true` to each member. `--ci` additionally writes `.github/workflows/baseline.yml` from `baseline-ci.yml`.

- [ ] **Step 1: Asset contents** (exact):

```toml
# assets/baseline.toml
# cargo-baseline configuration — https://github.com/BusiRocket/baseline
max_file_lines = 150
max_trait_methods = 12
crate_max_files = 75
crate_max_lines = 8000
unwrap_density = 10
disabled_rules = []
disabled_tips = []
```

```toml
# assets/clippy.toml
too-many-lines-threshold = 50
too-many-arguments-threshold = 4
cognitive-complexity-threshold = 10
```

```toml
# assets/rustfmt.toml
edition = "2024"
max_width = 100
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
```

```toml
# assets/rust-toolchain.toml
[toolchain]
channel = "stable"
components = ["clippy", "rustfmt"]
```

```toml
# assets/deny.toml
[licenses]
allow = ["MIT", "Apache-2.0", "Apache-2.0 WITH LLVM-exception", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Unicode-3.0", "Zlib"]

[bans]
multiple-versions = "warn"

[advisories]
yanked = "deny"

[sources]
unknown-registry = "deny"
unknown-git = "deny"
```

```toml
# assets/workspace-lints.toml
# Paste into your root Cargo.toml. Each member crate then needs:
#   [lints]
#   workspace = true

[workspace.lints.rust]
unsafe_code = "deny"
rust_2018_idioms = { level = "warn", priority = -1 }
unsafe_op_in_unsafe_fn = "warn"
missing_debug_implementations = "warn"
elided_lifetimes_in_paths = "warn"
unused_crate_dependencies = "warn"

[workspace.lints.rustdoc]
broken_intra_doc_links = "deny"

[workspace.lints.clippy]
all = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
nursery = { level = "warn", priority = -1 }
# strict denies
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "deny"
indexing_slicing = "deny"
dbg_macro = "deny"
print_stdout = "deny"
cognitive_complexity = "deny"
# noisy pedantic/nursery allows
module_name_repetitions = "allow"
must_use_candidate = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
option_if_let_else = "allow"
significant_drop_tightening = "allow"
```

```yaml
# assets/baseline-ci.yml
name: baseline
on:
  push:
    branches: [main]
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --all --check
      - run: cargo clippy --workspace --all-targets -- -D warnings
      - run: cargo test --workspace
      - uses: EmbarkStudios/cargo-deny-action@v2
      - run: cargo install cargo-baseline --locked
      - run: cargo baseline check
```

- [ ] **Step 2: Failing integration test** — `tests/init_integration.rs`: run binary `baseline init <tempdir> --ci`; assert `baseline.toml`, `clippy.toml`, `rustfmt.toml`, `deny.toml`, `rust-toolchain.toml`, `.github/workflows/baseline.yml` exist; run again with a pre-existing modified `baseline.toml`, assert content NOT overwritten.

- [ ] **Step 3: Implement `init.rs`** — a `const ASSETS: &[(&str, &str)]` table of `(relative_path, include_str!(...))`; loop, create parent dirs, skip-if-exists, write; `--ci` appends the workflow tuple; print the paste-instructions block referencing `workspace-lints.toml` content (also written to the project root as `workspace-lints.toml` so the user has it on disk).

- [ ] **Step 4: Run tests, verify pass** — `cargo test -p cargo-baseline`

- [ ] **Step 5: Commit** — `git add -A packages/cargo-baseline && git commit -m "feat(cargo-baseline): init command with config assets"`

---

### Task 14: Dogfood — the crate passes its own check

**Files:**
- Modify: whatever `cargo baseline check` flags in `packages/cargo-baseline` itself
- Create: `packages/cargo-baseline/baseline.toml` (defaults, from init)

**Steps:**

- [ ] **Step 1:** Run: `cargo run -p cargo-baseline -- baseline check packages/cargo-baseline`
- [ ] **Step 2:** Fix every reported error by refactoring (split files, move visitors out, extract helpers to own files). Do NOT weaken rules to pass; `disabled_rules` stays empty. Exception allowed: if `check.rs` exceeds 150 lines, split into `check_crate.rs` (per-crate logic) + `check.rs` (orchestration) — each one primary fn.
- [ ] **Step 3:** Re-run until: `baseline: 0 errors, 0 tips` (tips about our own deps are acceptable if any fire — errors must be 0).
- [ ] **Step 4:** `cargo test -p cargo-baseline && cargo clippy -p cargo-baseline -- -D warnings`
- [ ] **Step 5: Commit** — `git commit -am "refactor(cargo-baseline): pass own baseline check (dogfood)"`

---

### Task 15: Docs — crate README + adoption guide

**Files:**
- Create: `packages/cargo-baseline/README.md`
- Create: `docs/guides/rust-baseline-adoption.md`
- Modify: `README.md` (repo root — add cargo-baseline to the package list, matching existing entries' style)

**Content requirements (README):** what it enforces (table of 8 rules + 4 tips with one-line descriptions and defaults), install (`cargo install cargo-baseline`), usage (`cargo baseline init [--ci]`, `cargo baseline check`), `baseline.toml` reference (all 7 keys), the include_str! SQL pattern with a 6-line example (`let sql = include_str!("../sql/get_user.sql");` + `conn.query_row(sql, ...)`), test exemptions, link to spec.

**Content requirements (adoption guide):** step-by-step for an EXISTING project (project-after-shaped): 1) `cargo baseline init --ci` in `src-tauri/`; 2) paste workspace-lints into Cargo.toml, add `[lints] workspace = true`; 3) first `cargo baseline check` run — triage order: grab-bag/barrel violations first (cheap mechanical splits), then `no-inline-sql` (move queries to `sql/*.sql` + `include_str!`), then god-trait split (`max-trait-methods`) which unlocks `max-file-lines` on the store; 4) ratchet strategy: temporarily raise `max_file_lines` in `baseline.toml` to current worst offender, lower it every PR — never disable rules; 5) clippy adoption: start `-W` locally, `-D` in CI once clean.

**Steps:** write both docs → verify links/paths referenced actually exist (`ls` each) → `git add ... && git commit -m "docs(cargo-baseline): README and adoption guide"`.

---

### Task 16: Template `templates/tauri-app`

**Files:**
- Create: `templates/tauri-app/` — start from `templates/vite-react-app` (copy it, keep its web tooling verbatim) and add:
  - `src-tauri/Cargo.toml` (tauri 2 deps + `[lints] workspace = true` comment header explaining single-crate case uses `[lints.*]` directly — copy the lint tables from `assets/workspace-lints.toml` converted to non-workspace form `[lints.rust]`/`[lints.clippy]`)
  - `src-tauri/src/main.rs` (thin: calls `app_lib::run()`), `src-tauri/src/lib.rs` (mods + `run()` with `tauri::Builder`), `src-tauri/src/commands/mod.rs` + `src-tauri/src/commands/greet.rs` (one `#[tauri::command]`), `src-tauri/sql/.gitkeep`, `src-tauri/baseline.toml`, `src-tauri/clippy.toml`, `src-tauri/rustfmt.toml`, `src-tauri/deny.toml`, `src-tauri/rust-toolchain.toml`, `src-tauri/tauri.conf.json` (minimal valid tauri 2 config, mirror consumer-t's structure: read `/Users/someone/p/consumer-t/src-tauri/tauri.conf.json` and reproduce with template placeholders)
- Modify: `packages/create-baseline/` template registry — find where existing templates are listed (grep `vite-react-app` in `packages/create-baseline/src`) and add `tauri-app` the same way.

**Steps:**
- [ ] Copy vite-react-app, add src-tauri files as above.
- [ ] Verify: `cargo run -p cargo-baseline -- baseline check templates/tauri-app/src-tauri` → `baseline: 0 errors`.
- [ ] Verify create-baseline lists it: run its test suite (`pnpm --filter create-baseline test` if present; else `pnpm --filter create-baseline build`).
- [ ] Commit: `git add templates/tauri-app packages/create-baseline && git commit -m "feat(templates): tauri-app template with rust baseline"`

---

### Task 17: Run against project-after — real-world report

**Files:**
- Create: `docs/reports/2026-07-23-project-after-baseline-report.md`

**Steps:**
- [ ] Run: `cargo run -p cargo-baseline -- baseline check /Users/someone/p/project-after/src-tauri | tee /private/tmp/project-after-report.txt` (expect MANY errors — sqlite_store.rs alone; non-zero exit is expected and correct).
- [ ] Also run against consumer-t: `cargo run -p cargo-baseline -- baseline check /Users/someone/p/consumer-t/src-tauri`.
- [ ] Write the report doc: error counts per rule per project, top-10 worst files, the recommended project-after attack order (from the adoption guide: barrel → SQL extraction → Store trait segregation → file splits), and the exact commands to start (`cargo baseline init --ci` inside `src-tauri`). Do NOT modify project-after or consumer-t.
- [ ] Sanity: tool must not crash on any project-after file (538 files — parse errors on valid code are tool bugs; fix before closing task).
- [ ] Commit: `git add docs/reports && git commit -m "docs: baseline check reports for project-after and consumer-t"`

---

## Verification (whole deliverable)

```bash
cargo test -p cargo-baseline \
  && cargo clippy -p cargo-baseline --all-targets -- -D warnings \
  && cargo run -p cargo-baseline -- baseline check packages/cargo-baseline \
  && cargo run -p cargo-baseline -- baseline check templates/tauri-app/src-tauri
```

All four must succeed. crates.io publish is a separate later step (needs `cargo login`) — not part of this plan.
