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

    fn visit_macro(&mut self, node: &'ast syn::Macro) {
        let ident = node.path.segments.last().map(|seg| seg.ident.to_string());
        let allowlisted = matches!(
            ident.as_deref(),
            Some("include_str" | "include_bytes" | "env" | "option_env" | "concat")
        );

        if !allowlisted {
            let mut stack: Vec<proc_macro2::TokenStream> = vec![node.tokens.clone()];
            while let Some(stream) = stack.pop() {
                for tt in stream {
                    match tt {
                        proc_macro2::TokenTree::Group(group) => {
                            stack.push(group.stream());
                        }
                        proc_macro2::TokenTree::Literal(lit) => {
                            if let Ok(lit_str) = syn::parse2::<syn::LitStr>(
                                std::iter::once(proc_macro2::TokenTree::Literal(lit)).collect(),
                            ) {
                                if SQL.is_match(&lit_str.value()) {
                                    self.hits.push(lit_str.span().start().line);
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        syn::visit::visit_macro(self, node);
    }
}
