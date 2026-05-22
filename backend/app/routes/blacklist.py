from flask import Blueprint, jsonify
from app.models import BlacklistDomain

bp = Blueprint('blacklist', __name__, url_prefix='/api/blacklist')

@bp.route('/', methods=['GET'])
def get_blacklist():
    """
    Endpoint publik yang mengembalikan daftar domain 
    dalam format JSON untuk Chrome Extension.
    """
    domains = BlacklistDomain.query.all()
    domain_list = [domain.domain_name for domain in domains]
    
    return jsonify({
        'domains': domain_list,
        'count': len(domain_list)
    }), 200
