use syn::visit::Visit;

use crate::config::BaselineConfig;
use crate::engine::cfg_test_line_ranges::cfg_test_line_ranges;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::diagnostics_for_lines::diagnostics_for_lines;
use crate::engine::file_context::FileContext;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;
use crate::rules::sql_visitor::SqlVisitor;

pub struct NoInlineSql;

impl Rule for NoInlineSql {
    fn name(&self) -> &'static str {
        "no-inline-sql"
    }

    fn applies_to_test_scope(&self) -> bool {
        true
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        // An inline `#[cfg(test)] mod` block is the assertion's own data -
        // a table-driven test spells its rows out - so those line ranges stay
        // exempt. A dedicated test file is not: a 1,000-line fixture reads
        // and diffs better as `sql/*.sql` behind `include_str!`, which is why
        // this rule opts into test scope below.
        let test_ranges = cfg_test_line_ranges(&ctx.ast);

        let mut v = SqlVisitor { hits: Vec::new() };
        v.visit_file(&ctx.ast);
        let message = "SQL literal in .rs - move to sql/*.sql and load with include_str!";
        diagnostics_for_lines(
            &ctx.path,
            self.name(),
            Severity::Error,
            v.hits
                .into_iter()
                .filter(|line| !test_ranges.iter().any(|&(a, b)| *line >= a && *line <= b))
                .map(|line| (line, message.to_string())),
        )
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::parse_dummy_file::parse_dummy_file;
    use crate::engine::rule::Rule;

    fn check(src: &str) -> usize {
        let ctx = parse_dummy_file(src);
        NoInlineSql.check(&ctx, &BaselineConfig::default()).len()
    }

    #[test]
    fn flags_select_literal() {
        assert_eq!(
            check(r#"pub fn q() -> &'static str { "SELECT id FROM users WHERE x = ?1" }"#),
            1
        );
    }

    #[test]
    fn flags_multiline_create_table() {
        assert_eq!(
            check("pub const S: &str = \"CREATE TABLE t (\n id INTEGER\n);\";"),
            1
        );
    }

    #[test]
    fn ignores_plain_strings_and_include_str() {
        assert_eq!(
            check(r#"pub fn m() -> &'static str { "hello select something" }"#),
            0
        );
        assert_eq!(
            check(r#"pub const Q: &str = include_str!("sql/get_user.sql");"#),
            0
        );
    }

    #[test]
    fn flags_sql_inside_format_macro() {
        assert_eq!(
            check(r#"pub fn q(t: &str) -> String { format!("SELECT id FROM {t} WHERE x = ?1") }"#),
            1
        );
    }

    #[test]
    fn flags_sql_inside_query_macro() {
        assert_eq!(
            check(r#"pub fn q() { let _ = my_sql::query!("DELETE FROM users WHERE id = ?1"); }"#),
            1
        );
    }

    #[test]
    fn include_str_macro_still_ignored() {
        assert_eq!(
            check(r#"pub const Q: &str = include_str!("sql/select_from_users.sql");"#),
            0
        );
    }

    #[test]
    fn sql_inside_an_inline_test_module_is_ignored() {
        assert_eq!(
            check("#[cfg(test)]\nmod tests {\n    const Q: &str = \"SELECT id FROM users\";\n}\n"),
            0
        );
    }

    #[test]
    fn a_dedicated_test_file_still_reports() {
        // A whole test file is where a large fixture lands, and it can hold
        // `include_str!` as easily as production code can. Only the inline
        // `#[cfg(test)] mod` case above stays exempt.
        assert_eq!(
            check("#![cfg(test)]\nconst Q: &str = \"SELECT id FROM users\";\n"),
            1
        );
    }

    #[test]
    fn production_sql_beside_a_test_module_still_reports() {
        assert_eq!(
            check(
                "const Q: &str = \"SELECT id FROM users\";\n#[cfg(test)]\nmod tests {\n    fn t() {}\n}\n"
            ),
            1
        );
    }
}
