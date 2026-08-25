use crate::engine::cfg_meta_mentions_test::cfg_meta_mentions_test;

/// Whether an item is compiled only under `cargo test`.
///
/// Every rule that skips test scope goes through here, so the predicate is
/// parsed as a full `syn::Meta` rather than a bare ident: a crate that writes
/// `#[cfg(all(test, feature = "x"))]` used to have all of them scanning its
/// test modules as production code.
pub fn is_cfg_test_item(attrs: &[syn::Attribute]) -> bool {
    attrs.iter().any(|a| {
        a.path().is_ident("cfg")
            && a.parse_args::<syn::Meta>()
                .is_ok_and(|meta| cfg_meta_mentions_test(&meta))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_cfg_test() {
        let m: syn::ItemMod = syn::parse_quote! { #[cfg(test)] mod tests {} };
        assert!(is_cfg_test_item(&m.attrs));
        let m: syn::ItemMod = syn::parse_quote! { mod plain {} };
        assert!(!is_cfg_test_item(&m.attrs));
    }

    #[test]
    fn detects_compound_cfg_predicates() {
        let m: syn::ItemMod = syn::parse_quote! { #[cfg(all(test, feature = "x"))] mod tests {} };
        assert!(is_cfg_test_item(&m.attrs));
        let m: syn::ItemMod =
            syn::parse_quote! { #[cfg(any(test, debug_assertions))] mod tests {} };
        assert!(is_cfg_test_item(&m.attrs));
    }

    #[test]
    fn leaves_non_test_cfgs_alone() {
        let m: syn::ItemMod = syn::parse_quote! { #[cfg(not(test))] mod prod {} };
        assert!(!is_cfg_test_item(&m.attrs));
        let m: syn::ItemMod = syn::parse_quote! { #[cfg(feature = "x")] mod gated {} };
        assert!(!is_cfg_test_item(&m.attrs));
    }
}
