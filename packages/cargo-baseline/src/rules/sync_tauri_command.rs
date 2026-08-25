use syn::spanned::Spanned;

use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::has_tauri_command_attribute::has_tauri_command_attribute;
use crate::engine::is_cfg_test_item::is_cfg_test_item;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;

/// Opt-out marker, written on the line above the command.
const ALLOW_MARKER: &str = "baseline:allow sync-tauri-command";

pub struct SyncTauriCommand;

impl Rule for SyncTauriCommand {
    fn name(&self) -> &'static str {
        "sync-tauri-command"
    }

    fn check(&self, ctx: &FileContext, _cfg: &BaselineConfig) -> Vec<Diagnostic> {
        let lines: Vec<&str> = ctx.source.lines().collect();
        let mut diagnostics = Vec::new();

        for item in &ctx.ast.items {
            let syn::Item::Fn(f) = item else { continue };
            if is_cfg_test_item(&f.attrs) || f.sig.asyncness.is_some() {
                continue;
            }
            if !has_tauri_command_attribute(&f.attrs) {
                continue;
            }

            // The span starts at the first attribute, so the marker goes above
            // that - which is also where a reader looks for it.
            let line = f.span().start().line;
            let marked = line
                .checked_sub(2)
                .and_then(|index| lines.get(index))
                .is_some_and(|previous| previous.contains(ALLOW_MARKER));
            if marked {
                continue;
            }

            diagnostics.push(Diagnostic {
                path: ctx.path.clone(),
                line,
                rule: self.name(),
                severity: Severity::Error,
                message: format!(
                    "#[tauri::command] on a sync fn - Tauri runs it on the main thread, so any \
                     disk, DB or network work inside freezes the UI. Make it `async` and move \
                     blocking work into `spawn_blocking`, or mark it `// {ALLOW_MARKER}` if it \
                     is genuinely in-memory."
                ),
            });
        }

        diagnostics
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::parse_dummy_file::parse_dummy_file;

    fn check(src: &str) -> usize {
        SyncTauriCommand
            .check(&parse_dummy_file(src), &BaselineConfig::default())
            .len()
    }

    #[test]
    fn sync_command_is_flagged() {
        assert_eq!(check("#[tauri::command]\npub fn greet() {}\n"), 1);
    }

    #[test]
    fn async_command_is_fine() {
        assert_eq!(check("#[tauri::command]\npub async fn greet() {}\n"), 0);
    }

    #[test]
    fn a_plain_sync_fn_is_not_a_command() {
        assert_eq!(check("pub fn greet() {}\n"), 0);
    }

    #[test]
    fn the_allow_marker_exempts_one_command() {
        assert_eq!(
            check("// baseline:allow sync-tauri-command\n#[tauri::command]\npub fn now() {}\n"),
            0
        );
    }

    #[test]
    fn the_marker_only_covers_the_command_below_it() {
        assert_eq!(
            check(
                "// baseline:allow sync-tauri-command\n#[tauri::command]\npub fn a() {}\n\n#[tauri::command]\npub fn b() {}\n"
            ),
            1
        );
    }

    #[test]
    fn commands_in_a_cfg_test_module_are_ignored() {
        assert_eq!(
            check("#[cfg(test)]\nmod tests {\n    #[tauri::command]\n    pub fn a() {}\n}\n"),
            0
        );
    }
}
