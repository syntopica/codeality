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
