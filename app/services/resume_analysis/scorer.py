import re
from typing import List, Dict
from app.models.schemas import Skill

ACTION_VERBS = {"built", "developed", "implemented", "designed", "created", "architected"}

def _detect_section(text: str, section_name: str) -> bool:
    patterns = [
        rf"\b{section_name}\b",
        rf"{section_name}:",
        rf"{section_name}\s*:",
    ]
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def _get_section_weight(text: str, skill: str, skill_pos: int) -> float:
    text_lower = text.lower()
    skill_lower = skill.lower()
    
    start_pos = max(0, skill_pos - 200)
    end_pos = min(len(text), skill_pos + 200)
    context = text_lower[start_pos:end_pos]
    
    if _detect_section(context, "experience") or _detect_section(context, "work"):
        return 3.0
    elif _detect_section(context, "project"):
        return 2.0
    elif _detect_section(context, "skill"):
        return 1.0
    return 1.0

def _has_action_verb_nearby(text: str, skill: str, skill_pos: int) -> bool:
    start_pos = max(0, skill_pos - 50)
    end_pos = min(len(text), skill_pos + 50)
    context = text[start_pos:end_pos].lower()
    
    for verb in ACTION_VERBS:
        if verb in context:
            return True
    return False

def score_skills(skills_list: List[str], raw_text: str) -> List[Skill]:
    text_lower = raw_text.lower()
    skill_scores: Dict[str, float] = {}
    
    for skill in skills_list:
        skill_lower = skill.lower()
        count = text_lower.count(skill_lower)
        
        if count == 0:
            continue
        
        base_score = count * 0.1
        
        positions = []
        start = 0
        while True:
            pos = text_lower.find(skill_lower, start)
            if pos == -1:
                break
            positions.append(pos)
            start = pos + 1
        
        total_weighted_score = 0.0
        for pos in positions:
            section_weight = _get_section_weight(raw_text, skill, pos)
            action_bonus = 0.2 if _has_action_verb_nearby(raw_text, skill, pos) else 0.0
            total_weighted_score += (base_score * section_weight) + action_bonus
        
        skill_scores[skill] = total_weighted_score
    
    if not skill_scores:
        return []
    
    max_score = max(skill_scores.values())
    if max_score == 0:
        max_score = 1.0
    
    normalized_skills = []
    for skill, score in skill_scores.items():
        normalized_score = min(1.0, score / max_score)
        normalized_skills.append(Skill(name=skill, confidence=normalized_score))
    
    normalized_skills.sort(key=lambda x: x.confidence, reverse=True)
    
    return normalized_skills
