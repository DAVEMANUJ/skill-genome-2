from typing import List, Optional
from pydantic import BaseModel

class Skill(BaseModel):
    name: str
    confidence: float

class ManualSkill(BaseModel):
    name: str
    confidence: float

class Course(BaseModel):
    platform: str
    title: str
    url: str

class RoadmapSkill(BaseModel):
    name: str
    courses: List[Course]

class RoadmapPhase(BaseModel):
    phase: str
    skills: List[RoadmapSkill]

class ResumeAnalysisResponse(BaseModel):
    skills: List[Skill]
    roadmap: List[RoadmapPhase]
    extracted_skills: Optional[List[str]] = None
