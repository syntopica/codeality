use crate::config::BaselineConfig;
use crate::engine::cfg_test_module_paths::cfg_test_module_paths;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::is_test_scope_file::is_test_scope_file;
use crate::engine::rule::Rule;
use crate::rules::barrel_only_mod::BarrelOnlyMod;
use crate::rules::file_matches_item::FileMatchesItem;
use crate::rules::max_file_lines::MaxFileLines;
use crate::rules::max_trait_methods::MaxTraitMethods;
use crate::rules::no_inline_sql::NoInlineSql;
use crate::rules::one_primary_unit::OnePrimaryUnit;
use crate::rules::sync_tauri_command::SyncTauriCommand;
use crate::rules::tauri_command_placement::TauriCommandPlacement;

pub(super) fn run_rules(
    files: &[FileContext],
    cfg: &BaselineConfig,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let rules: Vec<Box<dyn Rule>> = vec![
        Box::new(MaxFileLines),
        Box::new(OnePrimaryUnit),
        Box::new(NoInlineSql),
        Box::new(MaxTraitMethods),
        Box::new(BarrelOnlyMod),
        Box::new(TauriCommandPlacement),
        Box::new(SyncTauriCommand),
        Box::new(FileMatchesItem),
    ];

    // Resolved once for the crate: which file is test scope depends on what
    // some *other* file declares, so it cannot be read per file.
    let declared_test_scope = cfg_test_module_paths(files);

    for rule in &rules {
        if cfg.disabled_rules.iter().any(|name| name == rule.name()) {
            continue;
        }
        for ctx in files {
            if !rule.applies_to_test_scope() && is_test_scope_file(ctx, &declared_test_scope) {
                continue;
            }
            diagnostics.extend(rule.check(ctx, cfg));
        }
    }
}
