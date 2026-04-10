"""
Faculty API – certification approval workflow.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.db import get_supabase_admin
from app.api.auth import get_current_user, require_role

router = APIRouter()


class CertAction(BaseModel):
    action: str  # 'approved' or 'rejected'
    reason: Optional[str] = None


@router.get("/certifications/pending")
async def get_pending_certs(user=Depends(require_role("faculty", "admin"))):
    res = (
        get_supabase_admin().table("certifications")
        .select("*, profiles!student_id(full_name, email, department)")
        .eq("verification_status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.put("/certifications/{cert_id}/review")
async def review_certification(cert_id: str, body: CertAction, user=Depends(require_role("faculty", "admin"))):
    if body.action not in ("approved", "rejected"):
        raise HTTPException(400, "Action must be 'approved' or 'rejected'")

    res = (
        get_supabase_admin().table("certifications")
        .update({
            "verification_status": body.action,
            "verified_by": user["id"],
            "verified_at": "now()",
        })
        .eq("id", cert_id)
        .eq("verification_status", "pending")
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Certification not found or already reviewed")

    # Send notification to student
    cert = res.data[0]
    status_text = "approved ✅" if body.action == "approved" else "rejected ❌"
    get_supabase_admin().table("notifications").insert({
        "user_id": cert["student_id"],
        "title": f"Certification {status_text}",
        "message": f'Your certification "{cert["name"]}" has been {status_text} by {user["full_name"]}.',
        "link": "/dashboard/certifications",
    }).execute()

    return {"message": f"Certification {body.action}", "data": res.data[0]}


@router.get("/students")
async def list_students(user=Depends(require_role("faculty", "admin"))):
    res = (
        get_supabase_admin().table("profiles")
        .select("*, reputation_scores(total_score)")
        .eq("role", "student")
        .order("full_name")
        .execute()
    )
    return res.data


@router.get("/analytics")
async def faculty_analytics(user=Depends(require_role("faculty", "admin"))):
    students = get_supabase_admin().table("profiles").select("id", count="exact").eq("role", "student").execute()
    pending = get_supabase_admin().table("certifications").select("id", count="exact").eq("verification_status", "pending").execute()
    approved = get_supabase_admin().table("certifications").select("id", count="exact").eq("verification_status", "approved").execute()
    skills_total = get_supabase_admin().table("skills").select("id", count="exact").execute()
    return {
        "total_students": students.count,
        "pending_certifications": pending.count,
        "approved_certifications": approved.count,
        "total_skills": skills_total.count,
    }
