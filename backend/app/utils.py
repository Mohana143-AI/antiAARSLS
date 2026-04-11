def calculate_hamming_distance(hash1_hex: str, hash2_hex: str) -> int:
    """
    Calculate the Hamming distance between two hexadecimal hashes.
    Lower distance means higher similarity.
    For a 64-bit dhash (16 hex chars), distance 0-10 is very close.
    """
    if len(hash1_hex) != len(hash2_hex):
        # If lengths differ, treat as completely different for safety
        return 64

    # Convert hex to integer
    val1 = int(hash1_hex, 16)
    val2 = int(hash2_hex, 16)

    # XOR the values: 1 bits represent differences
    xor_val = val1 ^ val2

    # Count the number of set bits (Hamming distance)
    return bin(xor_val).count('1')

def get_risk_level(distance: int):
    """
    Map Hamming distance to a risk level.
    """
    if distance == 0:
        return "high", "Exact duplicate detected."
    elif distance <= 6:
        return "high", f"Suspiciously similar (Distance: {distance}). Potential tampering."
    elif distance <= 12:
        return "medium", f"Moderate similarity (Distance: {distance}). Proof might be reused or edited."
    else:
        return "low", None
