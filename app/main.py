from flask import Flask, render_template, jsonify
from flask_cors import CORS

from app.api import resume
from app.api.user_profile import profile_bp
from app.api.integrations import integrations_bp
from app.api.recommendations import recommendations_bp
from app.api.pathways import pathways_bp
from app.routes.gap_analysis import gap_analysis_bp
from app.routes import auth_bp
from app.models.database import db

import os
from pathlib import Path


def _resolve_db_path() -> Path:
    override = os.getenv('SKILLGENOME_DB_PATH', '').strip()
    if override:
        return Path(override).expanduser().resolve()

    project_root = Path(__file__).resolve().parent.parent
    return (project_root / 'skillgenome.db').resolve()


def _sqlalchemy_sqlite_uri(db_path: Path) -> str:
    # SQLAlchemy expects sqlite:///<path> for absolute paths.
    return f"sqlite:///{db_path.as_posix()}"


def _parse_cors_origins() -> list[str]:
    raw = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    origins = [origin.strip() for origin in raw.split(',') if origin.strip()]
    return origins if origins else ['http://localhost:5173']


db_path = _resolve_db_path()
db_path.parent.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, template_folder='../templates')
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-only-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = _sqlalchemy_sqlite_uri(db_path)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db.init_app(app)

CORS(
    app,
    resources={
        r"/*": {
            "origins": _parse_cors_origins(),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,
        }
    },
)


@app.errorhandler(Exception)
def handle_exception(e):
    """Global error handler to ensure JSON response and useful logging."""
    import traceback

    app.logger.error(f"Server Error: {str(e)}")
    traceback.print_exc()

    response = jsonify(
        {
            "error": str(e),
            "message": "Internal Server Error",
        }
    )
    response.status_code = 500
    return response


# Register all blueprints
app.register_blueprint(resume.bp, url_prefix='/api/resume')
app.register_blueprint(profile_bp, url_prefix='/api')
app.register_blueprint(integrations_bp, url_prefix='/api')
app.register_blueprint(recommendations_bp, url_prefix='/api')
app.register_blueprint(pathways_bp, url_prefix='/api')
app.register_blueprint(gap_analysis_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/auth')

# Initialize database tables with SQLAlchemy
with app.app_context():
    db.create_all()


@app.route('/', methods=['GET'])
def root():
    """Serve the test interface"""
    return render_template('index.html')


@app.route('/api', methods=['GET'])
def api_info():
    """API documentation endpoint"""
    return (
        jsonify(
            {
                'status': 'ok',
                'service': 'SkillGenome API',
                'version': '1.0.0',
                'endpoints': {
                    'user_profiles': '/api/profile',
                    'resume_analysis': '/api/resume/analyze',
                    'gap_analysis': '/api/gap-analysis/<user_id>',
                    'linkedin_import': '/api/import/linkedin',
                    'health': '/health',
                    'test_interface': '/',
                },
            }
        ),
        200,
    )


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    debug = os.getenv('FLASK_DEBUG', '0').strip().lower() in {'1', 'true', 'yes'}

    print('=' * 60)
    print(' SkillGenome Backend Server Starting...')
    print('=' * 60)
    print('Server: http://localhost:5000')
    print('Health: http://localhost:5000/health')
    print(f'Database: {db_path}')
    print('API Docs: See /api endpoints')
    print('=' * 60)

    app.run(debug=debug, host='0.0.0.0', port=5000)
