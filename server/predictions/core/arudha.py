# core/arudha.py
def arudha_pada(lagna_sign_idx: int, house_offset: int, lord_sign_idx: int) -> int:
    """
    Returns sign index (0..11) for Arudha of given house.
    Parashara rule: count as many from house to its lord, then same number forward from the lord.
    If result falls in the same sign as house or the 7th from it, move 10 signs forward.
    """
    house_sign = (lagna_sign_idx + house_offset) % 12
    # distance from house sign to lord sign (1..12)
    dist = (lord_sign_idx - house_sign) % 12
    if dist == 0: dist = 12
    target = (lord_sign_idx + dist) % 12
    if target == house_sign or target == (house_sign + 6) % 12:
        target = (target + 10) % 12
    return target
