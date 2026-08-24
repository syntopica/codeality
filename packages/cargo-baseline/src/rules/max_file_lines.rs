use crate::config::BaselineConfig;
use crate::engine::cfg_test_line_ranges::cfg_test_line_ranges;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_test_scope_file::is_test_scope_file;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct MaxFileLines;

impl Rule for MaxFileLines {
    fn name(&self) -> &'static str {
        "max-file-lines"
    }

    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic> {
        // Whole-file test scope: a `tests` directory or a `#![cfg(test)]` file.
        if is_test_scope_file(ctx) {
            return Vec::new();
        }

        // Inline `#[cfg(test)] mod { .. }` blocks are the file's own unit
        // tests. Rust keeps them beside the code they test, so counting them
        // charges production code for its tests - the same reason files under
        // a `tests` directory are skipped above.
        let test_ranges = cfg_test_line_ranges(&ctx.ast);

        // Count code lines: blank lines, comment-only lines, and block comment lines don't count
        let mut count = 0;
        let mut in_block_comment = false;

        for (index, line) in ctx.source.lines().enumerate() {
            let number = index + 1;
            if test_ranges.iter().any(|&(a, b)| number >= a && number <= b) {
                continue;
            }
            let t = line.trim();

            if in_block_comment {
                if t.contains("*/") {
                    in_block_comment = false;
                }
                // Line doesn't count
            } else if t.is_empty() || t.starts_with("//") {
                // Blank and comment lines don't count
            } else if t.starts_with("/*") {
                // Block comment start
                if !t.contains("*/") {
                    in_block_comment = true;
                }
                // Line doesn't count
            } else {
                // Count this line
                count += 1;
            }
        }

        if count <= cfg.max_file_lines {
            return Vec::new();
        }

        vec![Diagnostic {
            path: ctx.path.clone(),
            line: 1,
            rule: self.name(),
            severity: Severity::Error,
            message: format!("file has {} code lines (max {})", count, cfg.max_file_lines),
        }]
    }
}

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

    #[test]
    fn inline_cfg_test_module_does_not_count_against_the_budget() {
        let body = format!(
            "{}#[cfg(test)]\nmod tests {{\n{}}}\n",
            "fn a() {}\n".repeat(100),
            "    fn t() {}\n".repeat(100)
        );
        let cfg = BaselineConfig::default();
        assert!(MaxFileLines.check(&ctx(&body), &cfg).is_empty());
    }

    #[test]
    fn production_lines_still_count_when_a_test_module_is_present() {
        let body = format!(
            "{}#[cfg(test)]\nmod tests {{\n    fn t() {{}}\n}}\n",
            "fn a() {}\n".repeat(200)
        );
        let cfg = BaselineConfig::default();
        let d = MaxFileLines.check(&ctx(&body), &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "max-file-lines");
    }

    #[test]
    fn inner_cfg_test_attribute_exempts_the_whole_file() {
        let body = format!("#![cfg(test)]\n{}", "fn a() {}\n".repeat(200));
        let cfg = BaselineConfig::default();
        assert!(MaxFileLines.check(&ctx(&body), &cfg).is_empty());
    }

    #[test]
    fn file_named_attests_is_not_treated_as_a_tests_dir() {
        let body = "fn a() {}\n".repeat(200);
        let ctx = FileContext::parse(std::path::Path::new("src/attests.rs"), body).unwrap();
        let cfg = BaselineConfig::default();
        let d = MaxFileLines.check(&ctx, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "max-file-lines");
    }
}
