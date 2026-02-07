"""
GitHub Integration - Real API Implementation
Free tier: 5000 requests/hour, no auth needed for public data
"""
import requests
import os
from urllib.parse import urlparse
from datetime import datetime, timezone
import time


# Simple in-memory cache to avoid burning GitHub rate limits during demos.
# Keyed by username. Value: (expires_at_epoch_seconds, repos_list)
_REPOS_CACHE = {}


def _cache_ttl_seconds() -> int:
    try:
        return int(os.getenv('GITHUB_CACHE_TTL_SECONDS', '600'))
    except Exception:
        return 600


def _has_github_token() -> bool:
    return bool(os.getenv('GITHUB_TOKEN', '').strip())


def _github_headers():
    token = os.getenv('GITHUB_TOKEN', '').strip()
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "SkillGenome",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def parse_github_username(value: str):
    """Accepts a username or a GitHub URL and returns the username."""
    if not value:
        return None

    raw = value.strip()
    if raw.startswith('http://') or raw.startswith('https://'):
        try:
            parsed = urlparse(raw)
            if parsed.netloc.lower() not in {"github.com", "www.github.com"}:
                return None
            parts = [p for p in parsed.path.split('/') if p]
            return parts[0] if parts else None
        except Exception:
            return None

    # looks like a plain username
    return raw


def fetch_repo_languages(languages_url: str):
    """Returns dict of language->bytes for a repo."""
    try:
        if not languages_url:
            return {}
        # Per-repo language breakdown is expensive (1 API call per repo).
        # Only allow it when a token is configured.
        if not _has_github_token():
            return {}
        res = requests.get(languages_url, headers=_github_headers(), timeout=10)
        if res.status_code != 200:
            return {}
        data = res.json()
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def fetch_user_repos(username: str):
    if not username:
        return None, {"error": "Missing GitHub username"}

    now = time.time()
    cached = _REPOS_CACHE.get(username)
    if cached:
        expires_at, repos = cached
        if isinstance(expires_at, (int, float)) and expires_at > now and isinstance(repos, list):
            return repos, None

    # Keep this as a single request to avoid rate limiting.
    # Note: unauthenticated requests are limited to 60/hour.
    url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
    response = requests.get(url, headers=_github_headers(), timeout=10)

    if response.status_code == 404:
        return None, {"error": "GitHub user not found"}

    if response.status_code == 403:
        remaining = response.headers.get('X-RateLimit-Remaining')
        reset = response.headers.get('X-RateLimit-Reset')
        if remaining == '0':
            msg = "GitHub API rate limit exceeded"
            if reset:
                msg += f" (resets at unix={reset})"
            msg += ". Set GITHUB_TOKEN env var to increase limits."
            return None, {"error": msg}
        return None, {"error": "GitHub API forbidden (403)"}

    if response.status_code != 200:
        return None, {"error": f"GitHub API error: {response.status_code}"}

    repos = response.json()
    if not isinstance(repos, list):
        return None, {"error": "GitHub API returned unexpected response"}

    ttl = _cache_ttl_seconds()
    if ttl > 0:
        _REPOS_CACHE[username] = (now + ttl, repos)

    return repos, None


def build_projects_and_skills(
    repos,
    *,
    project_limit: int = 10,
    include_language_breakdown: bool = False,
    language_call_limit: int = 0,
):
    projects = []
    skills_extracted = set()

    language_count = {}
    language_bytes = {}

    remaining_language_calls = max(int(language_call_limit or 0), 0)
    allow_language_breakdown = bool(include_language_breakdown) and remaining_language_calls > 0 and _has_github_token()

    for repo in repos[:project_limit]:
        # repo primary language
        primary_lang = repo.get('language')
        if primary_lang:
            skills_extracted.add(primary_lang)
            language_count[primary_lang] = language_count.get(primary_lang, 0) + 1

        # IMPORTANT: Skills are derived ONLY from programming languages.
        topics = []

        language_breakdown = {}
        if allow_language_breakdown and remaining_language_calls > 0:
            remaining_language_calls -= 1
            language_breakdown = fetch_repo_languages(repo.get('languages_url'))
            for lang, bytes_count in (language_breakdown or {}).items():
                skills_extracted.add(lang)
                try:
                    language_bytes[lang] = language_bytes.get(lang, 0) + int(bytes_count)
                except Exception:
                    continue

        projects.append({
            "name": repo.get('name'),
            "description": repo.get('description') or "No description",
            "url": repo.get('html_url'),
            "language": primary_lang or 'Unknown',
            "language_breakdown": language_breakdown,
            "topics": topics,
            "stars": repo.get('stargazers_count', 0),
            "updated_at": repo.get('updated_at')
        })

    # Derive skills: prefer bytes (more informative) if we fetched any
    skills = []
    if allow_language_breakdown and language_bytes:
        total_bytes = max(sum(language_bytes.values()), 1)
        for lang, bytes_count in sorted(language_bytes.items(), key=lambda x: x[1], reverse=True):
            confidence = min(bytes_count / total_bytes, 1.0)
            skills.append({
                "name": lang,
                "confidence": round(confidence, 2),
                "source": "github",
                "evidence": f"{bytes_count} bytes across imported repos"
            })
    else:
        total_repos = max(len(repos[:project_limit]), 1)
        for lang, count in sorted(language_count.items(), key=lambda x: x[1], reverse=True):
            confidence = min(count / total_repos, 1.0)
            skills.append({
                "name": lang,
                "confidence": round(confidence, 2),
                "source": "github",
                "evidence": f"Used in {count}/{total_repos} imported repos"
            })

    return projects, skills, sorted(list(skills_extracted))


def import_github_profile(
    username: str,
    *,
    project_limit: int = 10,
    include_language_breakdown: bool = False,
    language_call_limit: int = 0,
):
    """Fetches repos once and returns both projects and derived skills."""
    repos, err = fetch_user_repos(username)
    if err:
        return {"error": err.get("error", "GitHub fetch failed"), "projects": [], "skills": [], "skills_extracted": [], "total_repos": 0}

    projects, skills, skills_extracted = build_projects_and_skills(
        repos,
        project_limit=project_limit,
        include_language_breakdown=include_language_breakdown,
        language_call_limit=language_call_limit,
    )

    return {
        "projects": projects,
        "skills": skills,
        "skills_extracted": skills_extracted,
        "total_repos": len(repos),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

def import_github_projects(username, include_language_breakdown: bool = True, limit: int = 10):
    """
    Import user's GitHub repositories as projects
    """
    try:
        repos, err = fetch_user_repos(username)
        if err:
            return {"error": err.get("error", "GitHub fetch failed"), "projects": []}

        projects, _skills, skills_extracted = build_projects_and_skills(
            repos,
            project_limit=limit,
            include_language_breakdown=include_language_breakdown,
            # keep this legacy function conservative by default
            language_call_limit=0,
        )

        return {"projects": projects, "skills_extracted": skills_extracted, "total_repos": len(repos)}
    
    except Exception as e:
        return {"error": str(e), "projects": []}


def import_github_skills(username, include_language_breakdown: bool = True, limit: int = 30):
    """
    Extract skills from GitHub profile languages
    """
    try:
        repos, err = fetch_user_repos(username)
        if err:
            return []

        _projects, skills, _skills_extracted = build_projects_and_skills(
            repos,
            project_limit=limit,
            include_language_breakdown=include_language_breakdown,
            language_call_limit=0,
        )

        return skills
    
    except Exception as e:
        return []
