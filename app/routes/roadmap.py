from flask import Blueprint

roadmap_bp = Blueprint('roadmap', __name__)

@roadmap_bp.route('/roadmap')
def roadmap():
    return "Roadmap Endpoint"