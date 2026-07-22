pub fn to_snake_case(name: &str) -> String {
    let chars: Vec<char> = name.chars().collect();
    let mut result = String::new();

    for (i, &ch) in chars.iter().enumerate() {
        if ch.is_uppercase() {
            let prev_is_lowercase_or_digit = i > 0 && (chars[i - 1].is_lowercase() || chars[i - 1].is_numeric());
            let next_is_lowercase = i + 1 < chars.len() && chars[i + 1].is_lowercase();

            if prev_is_lowercase_or_digit || (i > 0 && chars[i - 1].is_uppercase() && next_is_lowercase) {
                result.push('_');
            }

            for lower_ch in ch.to_lowercase() {
                result.push(lower_ch);
            }
        } else {
            result.push(ch);
        }
    }

    result
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn user_repository() {
        assert_eq!(to_snake_case("UserRepository"), "user_repository");
    }

    #[test]
    fn already_snake_case() {
        assert_eq!(to_snake_case("build_draft_prompt"), "build_draft_prompt");
    }

    #[test]
    fn http_server() {
        assert_eq!(to_snake_case("HTTPServer"), "http_server");
    }
}
