/// Whether a `cfg` predicate mentions the `test` feature anywhere inside it.
///
/// `all(..)` and `any(..)` are walked recursively so a crate that gates its
/// tests behind a feature - `#[cfg(all(test, feature = "x"))]` - still reads
/// as test scope. `not(..)` is deliberately not walked: `#[cfg(not(test))]`
/// is production code, and descending into it would invert the answer.
pub fn cfg_meta_mentions_test(meta: &syn::Meta) -> bool {
    match meta {
        syn::Meta::Path(path) => path.is_ident("test"),
        syn::Meta::List(list) => {
            (list.path.is_ident("all") || list.path.is_ident("any"))
                && list
                    .parse_args_with(
                        syn::punctuated::Punctuated::<syn::Meta, syn::Token![,]>::parse_terminated,
                    )
                    .is_ok_and(|inner| inner.iter().any(cfg_meta_mentions_test))
        }
        syn::Meta::NameValue(_) => false,
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn meta(src: &str) -> syn::Meta {
        syn::parse_str(src).unwrap()
    }

    #[test]
    fn detects_a_bare_test_path() {
        assert!(cfg_meta_mentions_test(&meta("test")));
    }

    #[test]
    fn detects_test_inside_all_and_any() {
        assert!(cfg_meta_mentions_test(&meta("all(test, feature = \"x\")")));
        assert!(cfg_meta_mentions_test(&meta("any(test, debug_assertions)")));
        assert!(cfg_meta_mentions_test(&meta("all(unix, any(test, miri))")));
    }

    #[test]
    fn rejects_predicates_without_test() {
        assert!(!cfg_meta_mentions_test(&meta("feature = \"x\"")));
        assert!(!cfg_meta_mentions_test(&meta("all(unix, feature = \"x\")")));
    }

    #[test]
    fn does_not_descend_into_not() {
        assert!(!cfg_meta_mentions_test(&meta("not(test)")));
        assert!(!cfg_meta_mentions_test(&meta("all(not(test), unix)")));
    }
}
