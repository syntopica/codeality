use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;

pub trait Rule {
    fn name(&self) -> &'static str;
    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic>;
}
