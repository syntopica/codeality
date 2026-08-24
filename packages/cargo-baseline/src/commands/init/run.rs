use std::fs;
use std::path::Path;

const ASSETS: &[(&str, &str)] = &[
    (
        "baseline.toml",
        include_str!("../../../assets/baseline.toml"),
    ),
    ("clippy.toml", include_str!("../../../assets/clippy.toml")),
    ("rustfmt.toml", include_str!("../../../assets/rustfmt.toml")),
    ("deny.toml", include_str!("../../../assets/deny.toml")),
    (
        "rust-toolchain.toml",
        include_str!("../../../assets/rust-toolchain.toml"),
    ),
    (
        "workspace-lints.toml",
        include_str!("../../../assets/workspace-lints.toml"),
    ),
];

pub fn run(path: &Path, ci: bool) -> anyhow::Result<()> {
    let mut assets = ASSETS.to_vec();

    // Add CI workflow if requested
    if ci {
        assets.push((
            ".github/workflows/baseline.yml",
            include_str!("../../../assets/baseline-ci.yml"),
        ));
    }

    // Write each asset file
    for (rel_path, content) in assets {
        let target = path.join(rel_path);

        if target.exists() {
            println!("skip: {} (exists)", rel_path);
        } else {
            // Create parent directories if needed
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            // Write the file
            fs::write(&target, content)?;
            println!("write: {}", rel_path);
        }
    }

    // Print instruction block
    println!("\n=== Setup Instructions ===\n");
    println!("1. Copy the workspace lints from workspace-lints.toml into your root Cargo.toml:");
    println!("   - If using a workspace, paste under [workspace.lints.*]");
    println!("   - If using a single crate, convert [workspace.lints.*] to [lints.*]\n");
    println!("2. Add this to each member crate's Cargo.toml:");
    println!("   [lints]");
    println!("   workspace = true\n");
    println!("3. Run the baseline check:");
    println!("   cargo baseline check\n");

    Ok(())
}
