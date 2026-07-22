use syn::visit::Visit;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;
use crate::rules::no_inline_sql_visitor::SqlVisitor;

pub struct NoInlineSql;

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
