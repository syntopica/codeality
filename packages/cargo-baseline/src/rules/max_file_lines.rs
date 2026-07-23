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
        // Skip files under a `tests` directory (exact path component, not substring)
        if ctx.path.components().any(|c| c.as_os_str() == "tests") {
            return Vec::new();
        }

        // Count code lines: blank lines, comment-only lines, and block comment lines don't count
        let mut count = 0;
        let mut in_block_comment = false;

        for line in ctx.source.lines() {
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
    fn file_named_attests_is_not_treated_as_a_tests_dir() {
        let body = "fn a() {}\n".repeat(200);
        let ctx = FileContext::parse(std::path::Path::new("src/attests.rs"), body).unwrap();
        let cfg = BaselineConfig::default();
        let d = MaxFileLines.check(&ctx, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "max-file-lines");
    }
}
