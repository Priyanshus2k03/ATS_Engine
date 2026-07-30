"""
SQLite Database Module for ATS Engine — Job Description Persistent Storage
Uses Python's built-in sqlite3 (zero additional dependencies).
"""

import sqlite3
import uuid
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "jd_store.db")


def _get_connection():
    """Creates a new SQLite connection with row factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    return conn


def init_db():
    """Initialize the database and create the job_descriptions and users tables if they don't exist."""
    conn = _get_connection()
    try:
        # Create job descriptions table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                description TEXT NOT NULL,
                skills      TEXT DEFAULT '',
                education   TEXT DEFAULT '',
                min_exp     REAL DEFAULT 0,
                max_exp     REAL DEFAULT 7,
                location    TEXT DEFAULT '',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        """)
        
        # Create users table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                email          TEXT PRIMARY KEY,
                password_hash  TEXT NOT NULL
            )
        """)
        
        # Seed or sync default user hr@jobuss.com
        import hashlib
        default_email = "hr@jobuss.com"
        default_pass = "Jobuss_456"
        hashed = hashlib.sha256(default_pass.encode()).hexdigest()
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (default_email,))
        if not cursor.fetchone():
            conn.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (default_email, hashed))
            logger.info(f"Default user seeded: {default_email}")
        else:
            conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed, default_email))
            logger.info(f"Default user password synced: {default_email}")
            
        conn.commit()
        logger.info(f"JD Database initialized at: {DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize JD database: {e}")
        raise
    finally:
        conn.close()



def save_jd(title: str, description: str, skills: str = "", education: str = "",
            min_exp: float = 0, max_exp: float = 7, location: str = "") -> dict:
    """Save a new Job Description to the database. Returns the saved record."""
    jd_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        conn.execute(
            """INSERT INTO job_descriptions (id, title, description, skills, education, min_exp, max_exp, location, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (jd_id, title, description, skills, education, min_exp, max_exp, location, now, now)
        )
        conn.commit()
        logger.info(f"Saved JD: '{title}' (id={jd_id})")
        return {
            "id": jd_id, "title": title, "description": description,
            "skills": skills, "education": education,
            "min_exp": min_exp, "max_exp": max_exp, "location": location,
            "created_at": now, "updated_at": now
        }
    except Exception as e:
        logger.error(f"Failed to save JD '{title}': {e}")
        raise
    finally:
        conn.close()


def get_all_jds() -> list:
    """Get all saved JDs (summary: id, title, created_at, updated_at)."""
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "SELECT id, title, created_at, updated_at FROM job_descriptions ORDER BY updated_at DESC"
        )
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Failed to fetch JDs: {e}")
        raise
    finally:
        conn.close()


def get_jd_by_id(jd_id: str) -> dict | None:
    """Get a single JD by its ID. Returns full record or None."""
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "SELECT * FROM job_descriptions WHERE id = ?", (jd_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to fetch JD id={jd_id}: {e}")
        raise
    finally:
        conn.close()


def update_jd(jd_id: str, title: str, description: str, skills: str = "",
              education: str = "", min_exp: float = 0, max_exp: float = 7,
              location: str = "") -> dict | None:
    """Update an existing JD. Returns the updated record or None if not found."""
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_connection()
    try:
        cursor = conn.execute(
            """UPDATE job_descriptions 
               SET title=?, description=?, skills=?, education=?, min_exp=?, max_exp=?, location=?, updated_at=?
               WHERE id=?""",
            (title, description, skills, education, min_exp, max_exp, location, now, jd_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            return None
        logger.info(f"Updated JD: '{title}' (id={jd_id})")
        return get_jd_by_id(jd_id)
    except Exception as e:
        logger.error(f"Failed to update JD id={jd_id}: {e}")
        raise
    finally:
        conn.close()


def delete_jd(jd_id: str) -> bool:
    """Delete a JD by ID. Returns True if deleted, False if not found."""
    conn = _get_connection()
    try:
        cursor = conn.execute("DELETE FROM job_descriptions WHERE id = ?", (jd_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        if deleted:
            logger.info(f"Deleted JD id={jd_id}")
        return deleted
    except Exception as e:
        logger.error(f"Failed to delete JD id={jd_id}: {e}")
        raise
    finally:
        conn.close()


def get_user_by_email(email: str) -> dict | None:
    """Get a user record by email."""
    conn = _get_connection()
    try:
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to fetch user {email}: {e}")
        raise
    finally:
        conn.close()


def update_user_password(email: str, password_hash: str) -> bool:
    """Update a user's password hash."""
    conn = _get_connection()
    try:
        cursor = conn.execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            (password_hash, email.lower().strip())
        )
        conn.commit()
        updated = cursor.rowcount > 0
        if updated:
            logger.info(f"Updated password hash for user: {email}")
        return updated
    except Exception as e:
        logger.error(f"Failed to update password for {email}: {e}")
        raise
    finally:
        conn.close()

