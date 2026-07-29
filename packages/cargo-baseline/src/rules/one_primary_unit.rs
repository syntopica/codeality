use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::diagnostics_for_lines::diagnostics_for_lines;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::named_item::named_item;
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
            let Some((name, attrs, span)) = named_item(item) else {
                continue;
            };
            if is_cfg_test_item(attrs) {
                continue;
            }
            units.push((name, span.start().line));
        }
        diagnostics_for_lines(
            &ctx.path,
            self.name(),
            Severity::Error,
            units.iter().skip(1).map(|(name, line)| {
                (
                    *line,
                    format!(
                        "extra unit `{name}` - one primary item per file; extract to its own file"
                    ),
                )
            }),
        )
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::config::BaselineConfig;
    use crate::engine::rule::Rule;
    use crate::engine::test_support::parse_dummy_file;

    #[test]
    fn struct_plus_impls_is_one_unit() {
        let src = "pub struct A; impl A { pub fn f(&self) {} } impl std::fmt::Debug for A { fn fmt(&self, _: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { Ok(()) } }";
        let ctx = parse_dummy_file(src);
        assert!(OnePrimaryUnit.check(&ctx, &BaselineConfig::default()).is_empty());
    }

    #[test]
    fn private_helper_fn_is_flagged() {
        let src = "pub fn main_thing() {} fn helper() {}";
        let ctx = parse_dummy_file(src);
        let d = OnePrimaryUnit.check(&ctx, &BaselineConfig::default());
        assert_eq!(d.len(), 1);
        assert!(d[0].message.contains("helper"));
    }

    #[test]
    fn cfg_test_mod_is_exempt() {
        let src = "pub fn a() {} #[cfg(test)] mod tests { fn b() {} }";
        let ctx = parse_dummy_file(src);
        assert!(OnePrimaryUnit.check(&ctx, &BaselineConfig::default()).is_empty());
    }
}
