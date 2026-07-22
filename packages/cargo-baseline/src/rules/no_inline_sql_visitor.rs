use std::sync::LazyLock;

use regex::Regex;
use syn::visit::Visit;

use crate::engine::is_cfg_test_item::is_cfg_test_item;

static SQL: LazyLock<Regex> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)] // pattern is a compile-time constant
    Regex::new(r"(?is)\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE|DROP\s+(TABLE|INDEX))\b").unwrap()
});

pub(crate) struct SqlVisitor {
    pub(crate) hits: Vec<usize>,
}

impl<'ast> Visit<'ast> for SqlVisitor {
    fn visit_lit_str(&mut self, lit: &'ast syn::LitStr) {
        if SQL.is_match(&lit.value()) {
            self.hits.push(lit.span().start().line);
        }
    }

    fn visit_item_mod(&mut self, m: &'ast syn::ItemMod) {
        if is_cfg_test_item(&m.attrs) {
            return;
        }
        syn::visit::visit_item_mod(self, m);
    }
}
