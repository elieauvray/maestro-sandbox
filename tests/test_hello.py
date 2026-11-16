import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from hello import hello  # noqa: E402


def test_hello_with_name():
    assert hello("Ada") == "Hello, Ada!"


def test_hello_empty_string():
    assert hello("") == "Hello, !"


def test_hello_returns_str():
    assert isinstance(hello("Ada"), str)
