// Cargo integration test: several `#[test]` fns in one file is the shape of
// the thing, so the structural rules must stay quiet here. The SQL fixture
// must not.
const SEED: &str = "CREATE TABLE t (id INTEGER PRIMARY KEY)";

#[test]
fn seeds_the_table() {
    assert!(SEED.contains("CREATE TABLE"));
}

#[test]
fn reads_the_table() {
    assert!(SEED.contains("id"));
}
