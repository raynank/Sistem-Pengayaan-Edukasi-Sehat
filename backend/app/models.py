from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    longest_streak = db.Column(db.Integer, default=0)
    
    # Relationships
    relapses = db.relationship('RelapseLog', backref='user', lazy=True)

class RelapseLog(db.Model):
    __tablename__ = 'relapse_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    relapse_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    streak_days = db.Column(db.Integer, nullable=False)

class BlacklistDomain(db.Model):
    __tablename__ = 'blacklist_domains'
    id = db.Column(db.Integer, primary_key=True)
    domain_name = db.Column(db.String(255), unique=True, nullable=False)
