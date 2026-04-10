from functools import lru_cache
from typing import Dict, List

from app.models.schemas import Course, RoadmapPhase

from app.database import get_db_connection


@lru_cache(maxsize=1)
def _load_courses() -> Dict[str, List[Dict[str, str]]]:
    conn = get_db_connection()
    courses_data: Dict[str, List[Dict[str, str]]] = {}
    try:
        # Structure: skill -> list of course dicts
        rows = conn.execute('SELECT skill, platform, title, url FROM courses').fetchall()

        for row in rows:
            skill = str(row['skill'] or '').strip().lower()
            if not skill:
                continue

            course = {
                'platform': row['platform'],
                'title': row['title'],
                'url': row['url'],
            }

            if skill not in courses_data:
                courses_data[skill] = []
            courses_data[skill].append(course)

    finally:
        conn.close()
    return courses_data


def map_courses_to_skills(roadmap_phases: List[RoadmapPhase]) -> List[RoadmapPhase]:
    courses_data = _load_courses()

    for phase in roadmap_phases:
        for skill in phase.skills:
            skill_lower = skill.name.lower()
            if skill_lower in courses_data:
                course_list = courses_data[skill_lower]
                skill.courses = [
                    Course(platform=course['platform'], title=course['title'], url=course['url'])
                    for course in course_list
                ]
            else:
                for key, course_list in courses_data.items():
                    if key in skill_lower or skill_lower in key:
                        skill.courses = [
                            Course(platform=course['platform'], title=course['title'], url=course['url'])
                            for course in course_list
                        ]
                        break

    return roadmap_phases
