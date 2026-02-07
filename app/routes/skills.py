from flask import Blueprint

skills_bp = Blueprint('skills', __name__)

@skills_bp.route('/skills')
def skills():
    return "Skills Endpoint"