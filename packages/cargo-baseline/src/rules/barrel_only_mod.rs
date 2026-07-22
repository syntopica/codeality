use syn::spanned::Spanned;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct BarrelOnlyMod;

impl Rule for BarrelOnlyMod {
    fn name(&self) -> &'static str {
        "barrel-only-mod"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let stem = ctx.path.file_name().and_then(|s| s.to_str()).unwrap_or("");
        if !matches!(stem, "mod.rs" | "lib.rs") {
            return Vec::new();
        }

        let is_lib_rs = stem == "lib.rs";
        let mut diagnostics: Vec<Diagnostic> = Vec::new();

        for item in &ctx.ast.items {
            let allowed = match item {
                syn::Item::Use(_) => true,
                syn::Item::ExternCrate(_) => true,
                syn::Item::Mod(m) => {
                    // Module declaration (no body) or cfg(test) mod with body
                    m.content.is_none() || is_cfg_test_item(&m.attrs)
                }
                syn::Item::Fn(f) => {
                    // In lib.rs, allow a function named "run" (Tauri entrypoint)
                    is_lib_rs && f.sig.ident == "run"
                }
                _ => false,
            };

            if !allowed {
                diagnostics.push(Diagnostic {
                    path: ctx.path.clone(),
                    line: item.span().start().line,
                    rule: self.name(),
                    severity: Severity::Error,
                    message: "logic in barrel file — mod.rs/lib.rs hold only mod declarations and re-exports".into(),
                });
            }
        }

        diagnostics
    }
}

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
