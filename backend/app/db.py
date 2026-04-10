from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

_supabase: Client | None = None
_supabase_admin: Client | None = None


def get_supabase() -> Client:
    """Public client (uses anon key, respects RLS)."""
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set in backend/.env  "
                "(copy .env.example → .env and fill in your Supabase project values)"
            )
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def get_supabase_admin() -> Client:
    """Service client (bypasses RLS, for admin operations)."""
    global _supabase_admin
    if _supabase_admin is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env"
            )
        _supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_admin

