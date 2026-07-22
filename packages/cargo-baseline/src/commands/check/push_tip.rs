use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;

pub(super) fn push_tip(
    name: &str,
    tip: Vec<Diagnostic>,
    cfg: &BaselineConfig,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if cfg.disabled_tips.iter().any(|disabled| disabled == name) {
        return;
    }
    diagnostics.extend(tip);
}
