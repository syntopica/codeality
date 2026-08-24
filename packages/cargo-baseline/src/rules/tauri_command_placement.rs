use syn::spanned::Spanned;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::has_tauri_command_attribute::has_tauri_command_attribute;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

pub struct TauriCommandPlacement;

impl Rule for TauriCommandPlacement {
    fn name(&self) -> &'static str {
        "tauri-command-placement"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let in_commands_dir = ctx.path.components().any(|c| c.as_os_str() == "commands");
        if in_commands_dir {
            return Vec::new();
        }

        let mut diagnostics = Vec::new();

        for item in &ctx.ast.items {
            if let syn::Item::Fn(f) = item {
                if is_cfg_test_item(&f.attrs) {
                    continue;
                }

                if has_tauri_command_attribute(&f.attrs) {
                    diagnostics.push(Diagnostic {
                        path: ctx.path.clone(),
                        line: f.span().start().line,
                        rule: self.name(),
                        severity: Severity::Error,
                        message: "#[tauri::command] outside commands/ - one command per file under commands/, thin wrapper delegating to domain fn".into(),
                    });
                }
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

    fn check(path: &str, src: &str) -> usize {
        let ctx = FileContext::parse(std::path::Path::new(path), src.into()).unwrap();
        TauriCommandPlacement
            .check(&ctx, &BaselineConfig::default())
            .len()
    }

    #[test]
    fn command_outside_commands_dir_flagged() {
        assert_eq!(
            check("src/lib.rs", "#[tauri::command] pub fn greet() {}"),
            1
        );
    }

    #[test]
    fn command_inside_commands_dir_ok() {
        assert_eq!(
            check(
                "src/commands/greet.rs",
                "#[tauri::command] pub fn greet() {}"
            ),
            0
        );
    }
}
