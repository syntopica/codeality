"""Fill a shipped asset's project-dependent values in."""

from pathlib import Path

from baseline_py.config.discover_source_roots import discover_source_roots
from baseline_py.init.first_party_packages import first_party_packages


def render_asset(content: str, project_root: Path) -> str:
    """Return the asset text with discovered roots and packages substituted.

    When nothing can be discovered, the CHANGE_ME placeholder stays: an honest
    placeholder beats a guessed package name.
    """
    roots = ", ".join(f'"{root}"' for root in discover_source_roots(project_root))
    rendered = content.replace('source-roots = ["src"]', f"source-roots = [{roots}]")
    packages = first_party_packages(project_root)
    if packages:
        rendered = rendered.replace("CHANGE_ME", packages[0])
    return rendered
