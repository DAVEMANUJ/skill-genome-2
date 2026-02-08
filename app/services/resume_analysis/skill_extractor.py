import json
import os
import re
from typing import List, Dict, Any, Set

nlp = None
kw_model = None
spacy_available = False

try:
    import spacy
    spacy_available = True
except Exception:
    spacy_available = False

try:
    from keybert import KeyBERT
    keybert_available = True
except Exception:
    keybert_available = False

def _load_nlp():
    global nlp
    if nlp is None and spacy_available:
        try:
            nlp = spacy.load("en_core_web_sm")
        except Exception:
            nlp = None
    return nlp

def _load_keybert():
    global kw_model
    if kw_model is None and keybert_available:
        try:
            kw_model = KeyBERT()
        except Exception:
            kw_model = None
    return kw_model

from app.database import get_db_connection

def _load_ontology() -> List[str]:
    conn = get_db_connection()
    ontology_skills = []
    try:
        rows = conn.execute('SELECT skill FROM ontology').fetchall()
        ontology_skills = [row['skill'] for row in rows]
    finally:
        conn.close()
    return ontology_skills

def extract_skills(normalized_text: str, raw_text: str) -> List[Dict[str, Any]]:
    """
    Extracts skills with confidence scores.
    Returns a list of dictionaries: [{'skill': str, 'confidence': float, 'method': str}]
    """
    found_skills: Dict[str, Dict[str, Any]] = {}
    
    ontology_skills = _load_ontology()
    
    # 1. Exact Regex matching (Highest confidence)
    for skill in ontology_skills:
        # Use word boundaries for exact match
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, normalized_text.lower()):
            found_skills[skill] = {
                'skill': skill,
                'confidence': 0.95,
                'method': 'exact_regex'
            }
    
    # 2. NLP-based extraction (Medium-High confidence)
    nlp_model = _load_nlp()
    if nlp_model is not None:
        try:
            doc = nlp_model(raw_text)
            for chunk in doc.noun_chunks:
                chunk_text = chunk.text.lower().strip()
                if len(chunk_text) > 2:
                    for skill in ontology_skills:
                        skill_lower = skill.lower()
                        if skill_lower == chunk_text:
                            if skill not in found_skills or found_skills[skill]['confidence'] < 0.9:
                                found_skills[skill] = {
                                    'skill': skill,
                                    'confidence': 0.9,
                                    'method': 'nlp_chunk_exact'
                                }
                        elif skill_lower in chunk_text:
                             if skill not in found_skills or found_skills[skill]['confidence'] < 0.7:
                                found_skills[skill] = {
                                    'skill': skill,
                                    'confidence': 0.7,
                                    'method': 'nlp_chunk_substring'
                                }
        except Exception:
            pass
            
    # 3. KeyBERT extraction (Medium confidence)
    kw_model = _load_keybert()
    if kw_model is not None:
        try:
            keywords = kw_model.extract_keywords(
                raw_text,
                keyphrase_ngram_range=(1, 2),
                stop_words='english',
                top_n=20
            )
            for keyword, score in keywords:
                keyword_lower = keyword.lower().strip()
                for skill in ontology_skills:
                    skill_lower = skill.lower()
                    if skill_lower == keyword_lower:
                        if skill not in found_skills or found_skills[skill]['confidence'] < 0.85:
                            found_skills[skill] = {
                                'skill': skill,
                                'confidence': 0.85,
                                'method': 'keybert_exact'
                            }
        except Exception:
            pass

    return list(found_skills.values())
