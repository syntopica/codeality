use syn::spanned::Spanned;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct MaxTraitMethods;

impl Rule for MaxTraitMethods {
    fn name(&self) -> &'static str {
        "max-trait-methods"
    }

    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let mut diags = Vec::new();
        for item in &ctx.ast.items {
            if let syn::Item::Trait(t) = item {
                if is_cfg_test_item(&t.attrs) {
                    continue;
                }
                let count = t
                    .items
                    .iter()
                    .filter(|i| matches!(i, syn::TraitItem::Fn(_)))
                    .count();
                if count > cfg.max_trait_methods {
                    diags.push(Diagnostic {
                        path: ctx.path.clone(),
                        line: t.span().start().line,
                        rule: self.name(),
                        severity: Severity::Error,
                        message: format!(
                            "trait `{}` has {} methods (max {}) — split into focused traits (interface segregation)",
                            t.ident, count, cfg.max_trait_methods
                        ),
                    });
                }
            }
        }
        diags
    }
}

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
