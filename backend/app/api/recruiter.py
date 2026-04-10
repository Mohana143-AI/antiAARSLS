"""
Recruiter API – search students, view profiles, download reports.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from app.db import get_supabase_admin
from app.api.auth import get_current_user, require_role

router = APIRouter()


@router.get("/search")
async def search_students(
    q: Optional[str] = None,
    skill: Optional[str] = None,
    department: Optional[str] = None,
    min_score: Optional[float] = None,
    sort_by: str = "total_score",
    user=Depends(require_role("recruiter", "admin")),
):
    """Search students by name, skill, department, or minimum reputation score."""
    query = (
        get_supabase_admin().table("profiles")
        .select("*, reputation_scores(total_score, skill_score, project_score, certification_score, validation_score)")
        .eq("role", "student")
    )

    if q:
        query = query.ilike("full_name", f"%{q}%")
    if department:
        query = query.eq("department", department)

    res = query.execute()
    results = res.data

    # Filter by skill (post-query since it's a join)
    if skill:
        skilled_students = (
            get_supabase_admin().table("skills")
            .select("student_id")
            .ilike("name", f"%{skill}%")
            .execute()
        )
        skilled_ids = {s["student_id"] for s in skilled_students.data}
        results = [r for r in results if r["id"] in skilled_ids]

    # Filter by minimum score
    if min_score is not None:
        results = [
            r for r in results
            if r.get("reputation_scores") and r["reputation_scores"].get("total_score", 0) >= min_score
        ]

    # Sort
    results.sort(
        key=lambda x: (x.get("reputation_scores") or {}).get("total_score", 0),
        reverse=True,
    )

    return results


@router.get("/student/{student_id}")
async def recruiter_view_student(student_id: str, user=Depends(require_role("recruiter", "admin"))):
    profile = get_supabase_admin().table("profiles").select("*").eq("id", student_id).single().execute()
    skills = get_supabase_admin().table("skills").select("*").eq("student_id", student_id).execute()
    projects = get_supabase_admin().table("projects").select("*").eq("student_id", student_id).execute()
    certs = (
        get_supabase_admin().table("certifications")
        .select("*")
        .eq("student_id", student_id)
        .eq("verification_status", "approved")
        .execute()
    )
    reputation = get_supabase_admin().table("reputation_scores").select("*").eq("student_id", student_id).single().execute()
    return {
        "profile": profile.data,
        "skills": skills.data,
        "projects": projects.data,
        "certifications": certs.data,
        "reputation": reputation.data,
    }


@router.get("/departments")
async def list_departments(user=Depends(require_role("recruiter", "admin"))):
    res = get_supabase_admin().table("profiles").select("department").eq("role", "student").execute()
    departments = sorted(set(r["department"] for r in res.data if r.get("department")))
    return departments


@router.get("/report/{student_id}")
async def download_report(student_id: str, user=Depends(require_role("recruiter", "admin", "faculty"))):
    """Get a JSON report for a student (can be rendered as PDF on the frontend)."""
    profile = get_supabase_admin().table("profiles").select("*").eq("id", student_id).single().execute()
    skills = get_supabase_admin().table("skills").select("*").eq("student_id", student_id).execute()
    projects = get_supabase_admin().table("projects").select("*").eq("student_id", student_id).execute()
    certs = get_supabase_admin().table("certifications").select("*").eq("student_id", student_id).eq("verification_status", "approved").execute()
    reputation = get_supabase_admin().table("reputation_scores").select("*").eq("student_id", student_id).single().execute()
    history = get_supabase_admin().table("reputation_history").select("*").eq("student_id", student_id).order("snapshot_date").execute()
    validations_count = get_supabase_admin().table("validations").select("id", count="exact").eq("student_id", student_id).execute()
    return {
        "report_type": "student_profile",
        "generated_at": "auto",
        "profile": profile.data,
        "skills": skills.data,
        "projects": projects.data,
        "certifications": certs.data,
        "reputation": reputation.data,
        "reputation_history": history.data,
        "total_validations_received": validations_count.count,
    }
