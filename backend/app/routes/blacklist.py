from flask import Blueprint, jsonify, request
from app.models import BlacklistDomain

bp = Blueprint('blacklist', __name__, url_prefix='/api/blacklist')

@bp.route('/', methods=['GET'])
def get_blacklist():
    """
    Endpoint publik yang mengembalikan daftar domain 
    dalam format JSON untuk Chrome Extension.
    Dibatasi agar tidak melebihi kapasitas dynamic rules MV3 (30.000).
    """
    # Batas aman default adalah 25.000 (maksimal Chrome MV3: 30.000)
    limit = request.args.get('limit', 25000, type=int)
    
    # Ambil domain terbaru berdasarkan ID menurun, dibatasi sejumlah limit
    domains = BlacklistDomain.query.order_by(BlacklistDomain.id.desc()).limit(limit).all()
    domain_list = [domain.domain_name for domain in domains]
    
    return jsonify({
        'domains': domain_list,
        'count': len(domain_list),
        'limit_applied': limit
    }), 200
