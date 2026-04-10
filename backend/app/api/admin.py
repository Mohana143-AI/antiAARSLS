"""
Admin API – user management, audit logs, system analytics.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.db import get_supabase_admin
from app.api.auth import get_current_user, require_role

router = APIRouter()


class RoleUpdate(BaseModel):
    role: str


@router.get("/users")
async def list_all_users(user=Depends(require_role("admin"))):
    res = get_supabase_admin().table("profiles").select("*, reputation_scores(total_score)").order("created_at", desc=True).execute()
    return res.data


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, body: RoleUpdate, user=Depends(require_role("admin"))):
    if body.role not in ("student", "faculty", "admin", "recruiter"):
        raise HTTPException(400, "Invalid role")
    res = get_supabase_admin().table("profiles").update({"role": body.role}).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return {"message": f"Role updated to {body.role}"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(require_role("admin"))):
    if user_id == user["id"]:
        raise HTTPException(400, "Cannot delete yourself")
    get_supabase_admin().table("profiles").delete().eq("id", user_id).execute()
    return {"message": "User deleted"}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    table_name: Optional[str] = None,
    user=Depends(require_role("admin")),
):
    query = get_supabase_admin().table("audit_logs").select("*").order("created_at", desc=True).limit(limit)
    if table_name:
        query = query.eq("table_name", table_name)
    res = query.execute()
    return res.data


@router.get("/analytics")
async def admin_analytics(user=Depends(require_role("admin"))):
    students = get_supabase_admin().table("profiles").select("id", count="exact").eq("role", "student").execute()
    faculty = get_supabase_admin().table("profiles").select("id", count="exact").eq("role", "faculty").execute()
    recruiters = get_supabase_admin().table("profiles").select("id", count="exact").eq("role", "recruiter").execute()
    skills = get_supabase_admin().table("skills").select("id", count="exact").execute()
    projects = get_supabase_admin().table("projects").select("id", count="exact").execute()
    certs = get_supabase_admin().table("certifications").select("id", count="exact").execute()
    validations = get_supabase_admin().table("validations").select("id", count="exact").execute()

    # Average reputation
    scores = get_supabase_admin().table("reputation_scores").select("total_score").execute()
    avg_score = 0
    if scores.data:
        avg_score = sum(s["total_score"] for s in scores.data) / len(scores.data)

    return {
        "total_students": students.count,
        "total_faculty": faculty.count,
        "total_recruiters": recruiters.count,
        "total_skills": skills.count,
        "total_projects": projects.count,
        "total_certifications": certs.count,
        "total_validations": validations.count,
        "average_reputation": round(avg_score, 2),
    }
