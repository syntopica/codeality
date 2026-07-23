pub fn get_item(id: i64) -> String {
    format!("SELECT id FROM t WHERE id = {id}")
}

pub fn other_fn() -> i32 {
    42
}
