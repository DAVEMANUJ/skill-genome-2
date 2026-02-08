import sqlite3
import uuid

def test_insert():
    try:
        conn = sqlite3.connect('skillgenome.db')
        user_id = str(uuid.uuid4())
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (user_id, name, email, target_sector, target_role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, 'Test', 'test@example.com', 'Healthcare', 'data scientist'))
        conn.commit()
        print(f"Success! ID: {user_id}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_insert()
