import os
import sqlite3
from pathlib import Path


def _default_db_path() -> Path:
    base_dir = Path(__file__).resolve().parent.parent
    return (base_dir / 'skillgenome.db').resolve()


def resolve_db_path() -> Path:
    """Resolve SQLite database path from env or default project location."""
    override = os.getenv('SKILLGENOME_DB_PATH', '').strip()
    if override:
        return Path(override).expanduser().resolve()
    return _default_db_path()


def get_db_connection():
    """Get database connection with production-safe defaults."""
    db_path = resolve_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(db_path), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row

    # WAL improves read/write concurrency for SQLite where supported.
    try:
        conn.execute('PRAGMA journal_mode=WAL')
    except sqlite3.OperationalError:
        pass

    return conn
