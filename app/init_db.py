import json
import os
import sqlite3
from pathlib import Path
from typing import Dict


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _resolve_db_path() -> Path:
    override = os.getenv("SKILLGENOME_DB_PATH", "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return (_project_root() / "skillgenome.db").resolve()


def _load_json(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _seed_reference_data(conn: sqlite3.Connection, data_dir: Path) -> Dict[str, int]:
    cursor = conn.cursor()
    inserted = {
        "roles": 0,
        "ontology": 0,
        "courses": 0,
    }

    roles_data = _load_json(data_dir / "roles.json")
    for role_name, categories in roles_data.items():
        if not isinstance(categories, dict):
            continue
        for category, skills in categories.items():
            if not isinstance(skills, list):
                continue
            for skill in skills:
                role = str(role_name).strip()
                category_name = str(category).strip()
                skill_name = str(skill).strip()
                if not role or not category_name or not skill_name:
                    continue

                cursor.execute(
                    """
                    SELECT 1 FROM roles
                    WHERE role_name = ? AND category = ? AND skill = ?
                    LIMIT 1
                    """,
                    (role, category_name, skill_name),
                )
                if cursor.fetchone():
                    continue

                cursor.execute(
                    """
                    INSERT INTO roles (role_name, category, skill)
                    VALUES (?, ?, ?)
                    """,
                    (role, category_name, skill_name),
                )
                inserted["roles"] += 1

    ontology_data = _load_json(data_dir / "ontology.json")
    for skill in ontology_data.get("skills", []):
        skill_name = str(skill).strip().lower()
        if not skill_name:
            continue

        cursor.execute(
            "SELECT 1 FROM ontology WHERE skill = ? LIMIT 1",
            (skill_name,),
        )
        if cursor.fetchone():
            continue

        cursor.execute(
            "INSERT INTO ontology (skill) VALUES (?)",
            (skill_name,),
        )
        inserted["ontology"] += 1

    courses_data = _load_json(data_dir / "courses.json")
    for skill, courses in courses_data.items():
        if not isinstance(courses, list):
            continue
        for course in courses:
            if not isinstance(course, dict):
                continue
            skill_name = str(skill).strip()
            platform = str(course.get("platform", "")).strip()
            title = str(course.get("title", "")).strip()
            url = str(course.get("url", "")).strip()
            if not skill_name or not platform or not title or not url:
                continue

            cursor.execute(
                """
                SELECT 1 FROM courses
                WHERE skill = ? AND platform = ? AND title = ? AND url = ?
                LIMIT 1
                """,
                (skill_name, platform, title, url),
            )
            if cursor.fetchone():
                continue

            cursor.execute(
                """
                INSERT INTO courses (skill, platform, title, url)
                VALUES (?, ?, ?, ?)
                """,
                (skill_name, platform, title, url),
            )
            inserted["courses"] += 1

    conn.commit()
    return inserted


def init_database() -> str:
    """Initialize SQLite schema and seed required reference data."""
    app_dir = Path(__file__).resolve().parent
    schema_path = app_dir / "schema.sql"
    data_dir = app_dir / "services" / "resume_analysis"
    db_path = _resolve_db_path()

    db_path.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print(" Initializing SkillGenome Database")
    print("=" * 60)
    print(f" Database location: {db_path}")
    print(f" Schema file: {schema_path}")

    schema_sql = schema_path.read_text(encoding="utf-8")

    conn = sqlite3.connect(str(db_path))
    try:
        conn.executescript(schema_sql)
        conn.commit()

        inserted = _seed_reference_data(conn, data_dir)

        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()

    print("\n Database initialized successfully")
    print(f" Tables available: {len(tables)}")
    for table in tables:
        print(f"   - {table}")

    print("\n Reference data seeded (new rows only):")
    print(f"   - roles: {inserted['roles']}")
    print(f"   - ontology: {inserted['ontology']}")
    print(f"   - courses: {inserted['courses']}")
    print("=" * 60)

    return str(db_path)


if __name__ == '__main__':
    init_database()
