"""
Upload API - Handle image uploads to Supabase storage with robust anti-tampering hashing.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict
import uuid
import io
from PIL import Image, ImageOps
from app.db import get_supabase_admin
from app.api.auth import get_current_user

router = APIRouter()

def generate_robust_hash(img: Image.Image) -> str:
    """
    Generates a 256-bit (16x16) dHash for an image.
    Includes normalization (cropping/equalization) to detect tampering.
    """
    try:
        # Convert to RGB to handle PNGs/GIFs correctly
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 1. Image Regularization (Remove borders/padding)
        # Auto-crop borders based on the corner pixel color
        bg = Image.new(img.mode, img.size, img.getpixel((0,0)))
        diff = ImageOps.difference(img, bg)
        bbox = diff.getbbox()
        if bbox:
            img = img.crop(bbox)

        # 2. Pre-processing for Hashing
        hash_size = 16
        img_gray = img.convert('L') # Grayscale
        img_norm = ImageOps.equalize(img_gray) # Histogram Equalization (Lighting invariant)
        # Resize to 17x16 for horizontal differences
        img_small = img_norm.resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        
        pixels = list(img_small.getdata())
        
        # 3. Calculate Differences (dHash)
        diff_bits = []
        for row in range(hash_size):
            for col in range(hash_size):
                p_left = pixels[row * (hash_size + 1) + col]
                p_right = pixels[row * (hash_size + 1) + col + 1]
                diff_bits.append('1' if p_left > p_right else '0')
        
        # 4. Convert bits to hex (64 hex characters)
        bit_string = "".join(diff_bits)
        hex_parts = []
        for i in range(0, 256, 4):
            hex_parts.append(hex(int(bit_string[i:i+4], 2))[2:])
        
        return "".join(hex_parts)
    except Exception as e:
        print(f"Hashing Error: {e}")
        return "0" * 64


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
) -> Dict[str, str]:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        file_bytes = await file.read()
        
        # Generate Robust Hash
        p_hash = ""
        try:
            img = Image.open(io.BytesIO(file_bytes))
            p_hash = generate_robust_hash(img)
            print(f"DEBUG: Generated 256-bit Robust Hash: {p_hash}")
        except Exception as e:
            print(f"Warning: Failed to hash image - {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid image file format")
            
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{user['id']}/{uuid.uuid4()}.{ext}"
        
        res = get_supabase_admin().storage.from_("proofs").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        
        public_url = get_supabase_admin().storage.from_("proofs").get_public_url(unique_filename)
        return {"proof_url": public_url, "image_hash": p_hash}
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Failed to upload: {str(e)}")
