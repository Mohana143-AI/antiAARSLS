"""
Student API – skills, projects, certifications, reputation, peer validation.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.db import get_supabase_admin
from app.api.auth import get_current_user, require_role
from app.utils import calculate_hamming_distance, get_risk_level

router = APIRouter()


# ── Models ───────────────────────────────────────────────
class SkillCreate(BaseModel):
    name: str
    category: str
    proficiency_level: int  # 1-5
    proof_url: Optional[str] = None
    image_hash: Optional[str] = None


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = []
    project_url: Optional[str] = None
    contribution_level: int  # 1-5
    team_size: int = 1
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    proof_url: Optional[str] = None
    image_hash: Optional[str] = None


class CertificationCreate(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_url: Optional[str] = None
    proof_url: Optional[str] = None
    image_hash: Optional[str] = None


class ValidationCreate(BaseModel):
    skill_id: str
    student_id: str
    rating: int  # 1-5
    comment: Optional[str] = None


# ── Skills ───────────────────────────────────────────────
@router.get("/skills")
async def get_my_skills(user=Depends(require_role("student"))):
    res = get_supabase_admin().table("skills").select("*").eq("student_id", user["id"]).order("created_at", desc=True).execute()
    return res.data


@router.post("/skills")
async def add_skill(body: SkillCreate, user=Depends(require_role("student"))):
    if body.proficiency_level < 1 or body.proficiency_level > 5:
        raise HTTPException(400, "Proficiency level must be 1-5")
        
    # ANTI-PLAGIARISM & TAMPER CHECK
    risk_level = "low"
    risk_details = None
    if body.image_hash:
        print(f"DEBUG: Processing Skill upload with hash: {body.image_hash}")
        # Check all existing skills for similarity
        existing_res = get_supabase_admin().table("skills").select("id, image_hash").execute()
        for item in existing_res.data:
            if not item.get("image_hash"): continue
            
            dist = calculate_hamming_distance(body.image_hash, item["image_hash"])
            level, detail = get_risk_level(dist)
            
            print(f"DEBUG: Comparing Skill {body.image_hash} to {item['image_hash']}. Distance: {dist}")
            
            if dist == 0:
                print(f"DEBUG: BLOCKED - Exact Plagiarism detected for Skill!")
                # Increment plagiarism count even if blocked? 
                # User wants count to increase, so we'll increment it before raising.
                try:
                    get_supabase_admin().rpc("increment_reputation", {
                        "uid": user["id"],
                        "amount": 1,
                        "field": "matches_detected",
                        "points": -50 # Penalty
                    }).execute()
                except: pass
                raise HTTPException(400, "PLAGIARISM DETECTED: This proof image has already been submitted!")


    try:
        res = get_supabase_admin().table("skills").insert({
            "student_id": user["id"],
            "name": body.name,
            "category": body.category,
            "proficiency_level": body.proficiency_level,
            "proof_url": body.proof_url,
            "image_hash": body.image_hash,
            "risk_level": risk_level,
            "risk_details": risk_details,
        }).execute()
        return res.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(409, "Skill already exists")
        raise HTTPException(400, str(e))


@router.put("/skills/{skill_id}")
async def update_skill(skill_id: str, body: SkillCreate, user=Depends(require_role("student"))):
    res = get_supabase_admin().table("skills").update({
        "name": body.name,
        "category": body.category,
        "proficiency_level": body.proficiency_level,
    }).eq("id", skill_id).eq("student_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(404, "Skill not found")
    return res.data[0]


@router.delete("/skills/{skill_id}")
async def delete_skill(skill_id: str, user=Depends(require_role("student"))):
    get_supabase_admin().table("skills").delete().eq("id", skill_id).eq("student_id", user["id"]).execute()
    return {"message": "Skill deleted"}


# ── Projects ────────────────────────────────────────────
@router.get("/projects")
async def get_my_projects(user=Depends(require_role("student"))):
    res = get_supabase_admin().table("projects").select("*").eq("student_id", user["id"]).order("created_at", desc=True).execute()
    return res.data


@router.post("/projects")
async def add_project(body: ProjectCreate, user=Depends(require_role("student"))):
    # ANTI-PLAGIARISM & TAMPER CHECK
    risk_level = "low"
    risk_details = None
    if body.image_hash:
        print(f"DEBUG: Processing Project upload with hash: {body.image_hash}")
        # Check all existing projects for similarity
        existing_res = get_supabase_admin().table("projects").select("id, image_hash").execute()
        for item in existing_res.data:
            if not item.get("image_hash"): continue
            
            dist = calculate_hamming_distance(body.image_hash, item["image_hash"])
            level, detail = get_risk_level(dist)
            
            print(f"DEBUG: Comparing Project {body.image_hash} to {item['image_hash']}. Distance: {dist}")
            
            if dist == 0:
                print(f"DEBUG: BLOCKED - Exact Plagiarism detected for Project!")
                try:
                    get_supabase_admin().rpc("increment_reputation", {
                        "uid": user["id"],
                        "amount": 1,
                        "field": "matches_detected",
                        "points": -50 # Penalty
                    }).execute()
                except: pass
                raise HTTPException(400, "PLAGIARISM DETECTED: This proof image has already been submitted for another project!")

            if level in ["high", "medium"]:
                risk_level = level
                risk_details = {"match_id": item["id"], "distance": dist, "reason": detail}
                break


    try:
        res = get_supabase_admin().table("projects").insert({
            "student_id": user["id"],
            "title": body.title,
            "description": body.description,
            "tech_stack": body.tech_stack,
            "project_url": body.project_url,
            "contribution_level": body.contribution_level,
            "team_size": body.team_size,
            "start_date": body.start_date,
            "end_date": body.end_date,
            "proof_url": body.proof_url,
            "image_hash": body.image_hash,
            "risk_level": risk_level,
            "risk_details": risk_details,
        }).execute()
        return res.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(409, "Project already exists")
        raise HTTPException(400, str(e))


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(require_role("student"))):
    get_supabase_admin().table("projects").delete().eq("id", project_id).eq("student_id", user["id"]).execute()
    return {"message": "Project deleted"}


# ── Certifications ──────────────────────────────────────
@router.get("/certifications")
async def get_my_certs(user=Depends(require_role("student"))):
    res = get_supabase_admin().table("certifications").select("*").eq("student_id", user["id"]).order("created_at", desc=True).execute()
    return res.data


@router.post("/certifications")
async def add_certification(body: CertificationCreate, user=Depends(require_role("student"))):
    # ANTI-PLAGIARISM & TAMPER CHECK
    risk_level = "low"
    risk_details = None
    if body.image_hash:
        print(f"DEBUG: Processing Certification upload with hash: {body.image_hash}")
        # Check all existing certifications for similarity
        existing_res = get_supabase_admin().table("certifications").select("id, image_hash").execute()
        for item in existing_res.data:
            if not item.get("image_hash"): continue
            
            dist = calculate_hamming_distance(body.image_hash, item["image_hash"])
            level, detail = get_risk_level(dist)
            
            print(f"DEBUG: Comparing Cert {body.image_hash} to {item['image_hash']}. Distance: {dist}")
            
            if dist == 0:
                print(f"DEBUG: BLOCKED - Exact Plagiarism detected for Cert!")
                try:
                    get_supabase_admin().rpc("increment_reputation", {
                        "uid": user["id"],
                        "amount": 1,
                        "field": "matches_detected",
                        "points": -50 # Penalty
                    }).execute()
                except: pass
                raise HTTPException(400, "PLAGIARISM DETECTED: This certification image is already in our system!")

            if level in ["high", "medium"]:
                risk_level = level
                risk_details = {"match_id": item["id"], "distance": dist, "reason": detail}
                break


    try:
        res = get_supabase_admin().table("certifications").insert({
            "student_id": user["id"],
            "name": body.name,
            "issuer": body.issuer,
            "issue_date": body.issue_date,
            "expiry_date": body.expiry_date,
            "credential_url": body.credential_url,
            "proof_url": body.proof_url,
            "image_hash": body.image_hash,
            "risk_level": risk_level,
            "risk_details": risk_details,
            "verification_status": "pending",
        }).execute()
        return res.data[0]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(409, "Certification already exists")
        raise HTTPException(400, str(e))


# ── Reputation ──────────────────────────────────────────
@router.get("/reputation")
async def get_my_reputation(user=Depends(require_role("student"))):
    res = get_supabase_admin().table("reputation_scores").select("*").eq("student_id", user["id"]).single().execute()
    return res.data


@router.get("/reputation/history")
async def get_reputation_history(user=Depends(require_role("student"))):
    res = (
        get_supabase_admin().table("reputation_history")
        .select("*")
        .eq("student_id", user["id"])
        .order("snapshot_date", desc=False)
        .execute()
    )
    return res.data


# ── Peer Validation ─────────────────────────────────────
@router.post("/validate")
async def validate_peer_skill(body: ValidationCreate, user=Depends(require_role("student"))):
    # Prevent self-validation
    if body.student_id == user["id"]:
        raise HTTPException(400, "Cannot validate your own skills")
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(400, "Rating must be 1-5")
    try:
        # Fetch validator's trust status
        validator_profile = get_supabase_admin().table("profiles").select("is_trusted").eq("id", user["id"]).single().execute()
        is_trusted = validator_profile.data.get("is_trusted", False)
        
        # Calculate Base Reputation Reward (e.g., 10 points per validation)
        # If trusted, give 15 points (1.5x multiplier)
        points = 15 if is_trusted else 10

        res = get_supabase_admin().table("validations").insert({
            "skill_id": body.skill_id,
            "validator_id": user["id"],
            "student_id": body.student_id,
            "rating": body.rating,
            "comment": body.comment,
        }).execute()
        
        # Update Recipient's Reputation Score
        get_supabase_admin().rpc("increment_reputation", {
            "uid": body.student_id,
            "amount": points,
            "field": "validation_score",
            "points": points
        }).execute()

        # Check if the VALIDATOR themselves should now be promoted to Trusted Peer
        # (Based on their total score and clean record)
        try:
            score_data = get_supabase_admin().table("reputation_scores").select("total_score, matches_detected").eq("student_id", user["id"]).single().execute()
            if score_data.data["total_score"] >= 500 and score_data.data["matches_detected"] == 0:
                get_supabase_admin().table("profiles").update({"is_trusted": True}).eq("id", user["id"]).execute()
        except: pass

        return {**res.data[0], "points_awarded": points, "is_trusted_validation": is_trusted}
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(409, "You already validated this skill")
        if "no_self_validation" in str(e).lower():
            raise HTTPException(400, "Cannot validate your own skills")
        raise HTTPException(400, str(e))


@router.get("/validations/{skill_id}")
async def get_validations_for_skill(skill_id: str, user=Depends(get_current_user)):
    res = get_supabase_admin().table("validations").select("*, profiles!validator_id(full_name)").eq("skill_id", skill_id).execute()
    return res.data


# ── Leaderboard (public) ────────────────────────────────
@router.get("/leaderboard")
async def leaderboard(user=Depends(get_current_user)):
    res = (
        get_supabase_admin().table("reputation_scores")
        .select("*, profiles!student_id!inner(full_name, department, avatar_url, role)")
        .eq("profiles.role", "student")
        .order("total_score", desc=True)
        .limit(50)
        .execute()
    )
    return res.data


# ── Notifications ───────────────────────────────────────
@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    res = (
        get_supabase_admin().table("notifications")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return res.data


@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user=Depends(get_current_user)):
    get_supabase_admin().table("notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", user["id"]).execute()
    return {"message": "Marked as read"}


# ── Profile ─────────────────────────────────────────────
@router.get("/profile/{student_id}")
async def get_student_profile(student_id: str, user=Depends(get_current_user)):
    profile = get_supabase_admin().table("profiles").select("*").eq("id", student_id).single().execute()
    skills = get_supabase_admin().table("skills").select("*").eq("student_id", student_id).execute()
    projects = get_supabase_admin().table("projects").select("*").eq("student_id", student_id).execute()
    certs = get_supabase_admin().table("certifications").select("*").eq("student_id", student_id).execute()
    reputation = get_supabase_admin().table("reputation_scores").select("*").eq("student_id", student_id).single().execute()
    return {
        "profile": profile.data,
        "skills": skills.data,
        "projects": projects.data,
        "certifications": certs.data,
        "reputation": reputation.data,
    }
