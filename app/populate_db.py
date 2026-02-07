import json
import sqlite3

def create_tables(conn):
    cursor = conn.cursor()

    # Create roles table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT NOT NULL,
        category TEXT NOT NULL,
        skill TEXT NOT NULL
    )
    ''')

    # Create ontology table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ontology (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill TEXT NOT NULL
    )
    ''')

    # Create courses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL
    )
    ''')

    conn.commit()

def populate_roles(conn, roles_file):
    with open(roles_file, 'r') as f:
        roles_data = json.load(f)

    cursor = conn.cursor()
    for role, categories in roles_data.items():
        for category, skills in categories.items():
            for skill in skills:
                cursor.execute(
                    'INSERT INTO roles (role_name, category, skill) VALUES (?, ?, ?)',
                    (role, category, skill)
                )
    conn.commit()

def populate_ontology(conn, ontology_file):
    with open(ontology_file, 'r') as f:
        ontology_data = json.load(f)

    cursor = conn.cursor()
    for skill in ontology_data['skills']:
        cursor.execute('INSERT INTO ontology (skill) VALUES (?)', (skill,))
    conn.commit()

def populate_courses(conn, courses_file):
    with open(courses_file, 'r') as f:
        courses_data = json.load(f)

    cursor = conn.cursor()
    for skill, courses in courses_data.items():
        for course in courses:
            cursor.execute(
                'INSERT INTO courses (skill, platform, title, url) VALUES (?, ?, ?, ?)',
                (skill, course['platform'], course['title'], course['url'])
            )
    conn.commit()

def main():
    conn = sqlite3.connect('skillgenome.db')

    create_tables(conn)

    populate_roles(conn, 'app/services/resume_analysis/roles.json')
    populate_ontology(conn, 'app/services/resume_analysis/ontology.json')
    populate_courses(conn, 'app/services/resume_analysis/courses.json')

    conn.close()

if __name__ == '__main__':
    main()