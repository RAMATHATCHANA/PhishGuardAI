from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import sqlite3
import os

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    gender = Column(String(50))
    age_group = Column(String(50))
    designation = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

def init_sqlite_logs():
    """Initialize SQLite database for detection logs"""
    db_path = os.path.join(os.path.dirname(__file__), 'logs.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detection_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            detection_type TEXT,
            label TEXT,
            score REAL,
            reasons TEXT,
            user_email TEXT,
            user_designation TEXT,
            user_age_group TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')
    
    conn.commit()
    conn.close()
    return db_path

def log_detection(detection_type, label, score, reasons, user_email=None, 
                 user_designation=None, user_age_group=None, lat=None, lon=None):
    """Log detection result to SQLite"""
    db_path = os.path.join(os.path.dirname(__file__), 'logs.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    reasons_str = '||'.join(reasons) if isinstance(reasons, list) else reasons
    
    cursor.execute('''
        INSERT INTO detection_logs 
        (detection_type, label, score, reasons, user_email, user_designation, user_age_group, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (detection_type, label, score, reasons_str, user_email, user_designation, user_age_group, lat, lon))
    
    conn.commit()
    conn.close()

def get_stats():
    """Get statistics from logs"""
    db_path = os.path.join(os.path.dirname(__file__), 'logs.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get counts by detection type
    cursor.execute('''
        SELECT detection_type, COUNT(*) as count, label
        FROM detection_logs
        GROUP BY detection_type, label
        ORDER BY detection_type, label
    ''')
    type_counts = cursor.fetchall()
    
    # Get recent logs
    cursor.execute('''
        SELECT timestamp, detection_type, label, score, reasons
        FROM detection_logs
        ORDER BY timestamp DESC
        LIMIT 50
    ''')
    recent_logs = cursor.fetchall()
    
    # Get user group stats
    cursor.execute('''
        SELECT user_designation, COUNT(*) as count
        FROM detection_logs
        WHERE user_designation IS NOT NULL
        GROUP BY user_designation
    ''')
    user_stats = cursor.fetchall()
    
    conn.close()
    
    return {
        'type_counts': type_counts,
        'recent_logs': recent_logs,
        'user_stats': user_stats
    }
