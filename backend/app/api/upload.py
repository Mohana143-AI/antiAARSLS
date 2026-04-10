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
        
        # Calculate perceptual hash for plagiarism detection (manual dhash to save space)
        try:
            from PIL import Image
            import io
            
            img = Image.open(io.BytesIO(file_bytes))
            
            # Simple dhash implementation
            # 1. Resize to 9x8, grayscale
            hash_size = 8
            img_small = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(img_small.getdata())
            
            # 2. Compare adjacent pixels
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    pixel_left = pixels[row * (hash_size + 1) + col]
                    pixel_right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(pixel_left > pixel_right)
            
            # 3. Convert bits to hex
            decimal_value = 0
            hex_parts = []
            for i, bit in enumerate(diff):
                if bit:
                    decimal_value += 2**(i % 8)
                if (i % 8) == 7:
                    hex_parts.append(hex(decimal_value)[2:].rjust(2, '0'))
                    decimal_value = 0
            p_hash = "".join(hex_parts)
            
        except Exception as e:
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
