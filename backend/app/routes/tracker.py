import datetime
from flask import Blueprint, jsonify, request
from app import db
from app.models import RelapseLog
from .auth import token_required

bp = Blueprint('tracker', __name__, url_prefix='/api/tracker')

@bp.route('/status', methods=['GET'])
@token_required
def status(current_user):
    """
    Menghitung selisih hari antara start_date dengan hari ini.
    """
    now = datetime.datetime.utcnow()
    streak_delta = now - current_user.start_date
    current_streak_days = streak_delta.days
    
    return jsonify({
        'current_streak_days': current_streak_days,
        'longest_streak': current_user.longest_streak,
        'start_date': current_user.start_date.isoformat()
    }), 200

@bp.route('/relapse', methods=['POST'])
@token_required
def relapse(current_user):
    """
    Mereset start_date menjadi 'now', mencatat riwayat ke RelapseLog, 
    dan mengupdate longest_streak jika perlu.
    """
    now = datetime.datetime.utcnow()
    streak_delta = now - current_user.start_date
    current_streak_days = streak_delta.days
    
    # Update longest_streak jika streak yang gagal lebih panjang
    if current_streak_days > current_user.longest_streak:
        current_user.longest_streak = current_streak_days
        
    # Catat relapse ke RelapseLog
    relapse_log = RelapseLog(
        user_id=current_user.id,
        relapse_date=now,
        streak_days=current_streak_days
    )
    db.session.add(relapse_log)
    
    # Reset start_date menjadi sekarang
    current_user.start_date = now
    
    db.session.commit()
    
    return jsonify({
        'message': 'Relapse berhasil dicatat. Tracker direset.',
        'failed_streak_days': current_streak_days,
        'new_start_date': now.isoformat(),
        'longest_streak': current_user.longest_streak
    }), 200
