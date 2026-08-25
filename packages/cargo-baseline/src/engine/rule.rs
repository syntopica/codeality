use crate::config::BaselineConfig;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;

pub trait Rule {
    fn name(&self) -> &'static str;
    fn check(&self, ctx: &FileContext, cfg: &BaselineConfig) -> Vec<Diagnostic>;

    /// Whether the rule still has something to say about a test-scope file.
    ///
    /// `check` walks `<crate>/tests` as well as `<crate>/src`, and the
    /// structural rules have no business there: an integration test is
    /// several `#[test]` fns in one file by construction, which is exactly
    /// what `one-primary-unit` and `file-matches-item` forbid. Rules opt in
    /// one by one instead of each re-deriving the same guard.
    fn applies_to_test_scope(&self) -> bool {
        false
    }
}
