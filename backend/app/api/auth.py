"""
Authentication & authorisation utilities.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db import get_supabase, get_supabase_admin

router = APIRouter()


# ── Pydantic models ──────────────────────────────────────
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"
    department: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None


# ── Dependency: get current user from access token ───────
async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        user_resp = get_supabase().auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
        
        # 1. Fetch profile
        profile_resp = (
            get_supabase_admin().table("profiles")
            .select("*")
            .eq("id", str(user.id))
            .execute()
        )
        
        # 2. If profile is missing (common with Google OAuth), Auto-Register
        if not profile_resp.data:
            print(f"DEBUG: Profile missing for {user.email}. Auto-creating...")
            
            # Use metadata for name if available
            full_name = user.user_metadata.get("full_name") or user.email
            
            # Create profile
            new_profile = (
                get_supabase_admin().table("profiles").insert({
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": full_name,
                    "role": "student",
                }).execute()
            )
            
            # Initialise reputation
            get_supabase_admin().table("reputation_scores").insert({
                "student_id": str(user.id),
            }).execute()
            
            return new_profile.data[0]
            
        return profile_resp.data[0]
    except Exception as e:
        print(f"DEBUG Auth Error: {e}")
        raise HTTPException(401, f"Authentication failed: {e}")


def require_role(*roles):
    """Dependency factory that enforces role-based access."""
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return user
    return role_checker


# ── Routes ───────────────────────────────────────────────
@router.post("/signup")
async def signup(body: SignUpRequest):
    try:
        auth_resp = get_supabase().auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        user = auth_resp.user
        if not user:
            raise HTTPException(400, "Signup failed")

        # Create profile
        get_supabase_admin().table("profiles").insert({
            "id": str(user.id),
            "email": body.email,
            "full_name": body.full_name,
            "role": body.role,
            "department": body.department,
        }).execute()

        # Initialise reputation score row
        get_supabase_admin().table("reputation_scores").insert({
            "student_id": str(user.id),
        }).execute()

        return {"message": "Account created", "user_id": str(user.id)}
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/login")
async def login(body: LoginRequest):
    try:
        resp = get_supabase().auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        return {
            "access_token": resp.session.access_token,
            "refresh_token": resp.session.refresh_token,
            "user": {
                "id": str(resp.user.id),
                "email": resp.user.email,
            },
        }
    except Exception as e:
        raise HTTPException(401, str(e))


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user


@router.put("/me")
async def update_me(body: ProfileUpdate, user=Depends(get_current_user)):
    """Update current user's profile."""
    try:
        update_data = {}
        if body.full_name is not None:
            update_data["full_name"] = body.full_name
        if body.department is not None:
            update_data["department"] = body.department
        if body.role is not None:
            if body.role not in ("student", "faculty", "admin", "recruiter"):
                raise HTTPException(400, "Invalid role")
            update_data["role"] = body.role
            
        if not update_data:
            return user
            
        res = get_supabase_admin().table("profiles").update(update_data).eq("id", user["id"]).execute()
        
        if len(res.data) == 0:
            raise HTTPException(404, "Profile not found")
            
        return res.data[0]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(400, str(e))


@router.get("/my-activity")
async def my_activity(user=Depends(get_current_user)):
    """Fetch recent activity logs for the current user."""
    res = (
        get_supabase_admin().table("audit_logs")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    return res.data


@router.get("/verify/{id}")
async def public_verify(id: str):
    """Publicly verify a student's profile via QR code."""
    try:
        # Fetch profile
        profile = (
            get_supabase_admin().table("profiles")
            .select("full_name, department, email, role, is_trusted")
            .eq("id", id)
            .single()
            .execute()
        )
        if not profile.data:
            raise HTTPException(404, "Profile not found")

        if profile.data.get("role") != "student":
            raise HTTPException(403, "Only student profiles can be publicly verified via QR.")

        # Fetch reputation score separately for 100% reliability
        reputation = (
            get_supabase_admin().table("reputation_scores")
            .select("total_score, matches_detected")
            .eq("student_id", id)
            .single()
            .execute()
        )
        
        # Combine data
        return {
            **profile.data,
            "reputation_scores": [reputation.data] if reputation.data else []
        }
    except Exception as e:
        print(f"DEBUG Verification Error: {e}")
        raise HTTPException(404, "Invalid verification ID")
