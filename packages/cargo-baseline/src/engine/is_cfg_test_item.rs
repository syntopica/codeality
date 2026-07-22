#[allow(dead_code)]
pub fn is_cfg_test_item(attrs: &[syn::Attribute]) -> bool {
    attrs.iter().any(|a| {
        a.path().is_ident("cfg")
            && a.parse_args::<syn::Ident>().is_ok_and(|i| i == "test")
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
}
