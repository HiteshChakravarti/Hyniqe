"""Hyniqe Shield - a safety checker for AI agent add-ons."""
__version__ = "0.1.0"

from .engine import Scanner, load_rules, ScanResult, Finding  # noqa: F401
