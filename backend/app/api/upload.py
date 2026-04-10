"""
Upload API - Handle image uploads to Supabase storage.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict
import uuid

from app.db import get_supabase_admin
from app.api.auth import get_current_user

router = APIRouter()

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
) -> Dict[str, str]:
    """
    Upload an image file to Supabase Storage 'proofs' bucket.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read file content
        file_bytes = await file.read()
        
        # Calculate perceptual hash for plagiarism detection
        try:
            from PIL import Image
            import io
            import imagehash
            img = Image.open(io.BytesIO(file_bytes))
            p_hash = str(imagehash.phash(img))
        except Exception as e:
            # If hashing fails (not an image, corrupt, etc.), we gracefully ignore or throw 400
            print(f"Warning: Failed to hash image - {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid image file format")
            
        # Generate a unique filename using user ID and UUID
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{user['id']}/{uuid.uuid4()}.{ext}"
        
        # Upload to Supabase Storage (bypassing RLS with admin client)
        res = get_supabase_admin().storage.from_("proofs").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = get_supabase_admin().storage.from_("proofs").get_public_url(unique_filename)
        
        # Return both the public URL and the image's hash
        return {"proof_url": public_url, "image_hash": p_hash}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
