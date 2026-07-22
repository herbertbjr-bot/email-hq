"""Vercel Python serverless entrypoint.

Vercel's @vercel/python builder loads whichever file vercel.json points a
build's "src" at and looks for an exported ASGI/WSGI `app`. This file lives
next to requirements.txt (so the builder finds dependencies without extra
config) and re-exports the real FastAPI app from app/main.py.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.main import app  # noqa: E402

__all__ = ["app"]
