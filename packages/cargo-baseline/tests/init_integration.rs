#![allow(clippy::unwrap_used, clippy::expect_used)]

use std::fs;
use std::process::Command;

#[test]
fn init_creates_assets_with_ci() {
    let temp_dir = std::env::temp_dir().join("bl-init-creates-assets-ci");
    // Clean up before test
    fs::remove_dir_all(&temp_dir).ok();
    fs::create_dir_all(&temp_dir).expect("create temp dir");

    // Run init with --ci
    let out = Command::new(env!("CARGO_BIN_EXE_cargo-baseline"))
        .args(["baseline", "init"])
        .arg(&temp_dir)
        .arg("--ci")
        .output()
        .expect("binary runs");

    assert!(out.status.success(), "init command should succeed");

    // Check that all asset files exist
    assert!(temp_dir.join("baseline.toml").exists(), "baseline.toml should exist");
    assert!(temp_dir.join("clippy.toml").exists(), "clippy.toml should exist");
    assert!(temp_dir.join("rustfmt.toml").exists(), "rustfmt.toml should exist");
    assert!(temp_dir.join("deny.toml").exists(), "deny.toml should exist");
    assert!(temp_dir.join("rust-toolchain.toml").exists(), "rust-toolchain.toml should exist");
    assert!(
        temp_dir.join("workspace-lints.toml").exists(),
        "workspace-lints.toml should exist"
    );
    assert!(
        temp_dir.join(".github/workflows/baseline.yml").exists(),
        ".github/workflows/baseline.yml should exist with --ci"
    );
}

#[test]
fn init_skips_existing_files() {
    let temp_dir = std::env::temp_dir().join("bl-init-skips-existing");
    // Clean up before test
    fs::remove_dir_all(&temp_dir).ok();
    fs::create_dir_all(&temp_dir).expect("create temp dir");

    // Create a pre-existing baseline.toml with custom content
    let baseline_path = temp_dir.join("baseline.toml");
    let custom_content = "# Custom baseline.toml\nmax_file_lines = 999\n";
    fs::write(&baseline_path, custom_content).expect("write custom baseline.toml");

    // Run init
    let out = Command::new(env!("CARGO_BIN_EXE_cargo-baseline"))
        .args(["baseline", "init"])
        .arg(&temp_dir)
        .output()
        .expect("binary runs");

    assert!(out.status.success(), "init command should succeed");

    // Check that custom content is preserved
    let content = fs::read_to_string(&baseline_path).expect("read baseline.toml");
    assert_eq!(
        content, custom_content,
        "baseline.toml should not be overwritten"
    );

    // Clean up
    fs::remove_dir_all(&temp_dir).ok();
}
