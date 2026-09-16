"""Paths recognised as machine-generated without any configuration."""

DEFAULT_GENERATED_GLOBS: tuple[str, ...] = (
    "**/migrations/*.py",
    "**/*_pb2.py",
    "**/*_pb2_grpc.py",
    "**/ui_*.py",
    "**/*_ui.py",
    "**/resources_rc.py",
)
