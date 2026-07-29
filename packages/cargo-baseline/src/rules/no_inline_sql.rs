use syn::visit::Visit;

use crate::config::BaselineConfig;
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

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let mut v = SqlVisitor { hits: Vec::new() };
        v.visit_file(&ctx.ast);
        let message = "SQL literal in .rs - move to sql/*.sql and load with include_str!";
        diagnostics_for_lines(
            &ctx.path,
            self.name(),
            Severity::Error,
            v.hits.into_iter().map(|line| (line, message.to_string())),
        )
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::rule::Rule;
    use crate::engine::parse_dummy_file::parse_dummy_file;

    fn check(src: &str) -> usize {
        let ctx = parse_dummy_file(src);
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

    #[test]
    fn flags_sql_inside_format_macro() {
        assert_eq!(check(r#"pub fn q(t: &str) -> String { format!("SELECT id FROM {t} WHERE x = ?1") }"#), 1);
    }

    #[test]
    fn flags_sql_inside_query_macro() {
        assert_eq!(check(r#"pub fn q() { let _ = my_sql::query!("DELETE FROM users WHERE id = ?1"); }"#), 1);
    }

    #[test]
    fn include_str_macro_still_ignored() {
        assert_eq!(check(r#"pub const Q: &str = include_str!("sql/select_from_users.sql");"#), 0);
    }
}
