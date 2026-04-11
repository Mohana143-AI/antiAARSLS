def calculate_hamming_distance(hash1_hex: str, hash2_hex: str) -> int:
    """
    Calculate the Hamming distance between two hexadecimal hashes.
    Lower distance means higher similarity.
    For a 256-bit dhash (64 hex chars), distance 0-10 is extremely close.
    """
    # Direct check for exact match
    h1 = hash1_hex.strip().lower()
    h2 = hash2_hex.strip().lower()
    
    if h1 == h2:
        return 0

    if len(h1) != len(h2):
        # Different hash lengths, could be transition period data
        return 256

    # Convert hex to integer
    val1 = int(h1, 16)
    val2 = int(h2, 16)

    # XOR the values: 1 bits represent differences
    xor_val = val1 ^ val2

    # Count the number of set bits (Hamming distance)
    return bin(xor_val).count('1')


def get_risk_level(distance: int):
    """
    Map Hamming distance to a risk level for 256-bit hashes.
    """
    if distance <= 5:
        return "high", f"PLAGIARISM DETECTED: Exact or near-identical image found (Distance: {distance})."
    elif distance <= 40:
        return "high", f"TAMPERING DETECTED: Suspiciously similar image (Distance: {distance}). Content likely edited."
    elif distance <= 80:
        return "medium", f"POTENTIAL PLAGIARISM: Visually similar layout/template (Distance: {distance})."
    else:
        return "low", None
