
def calculate_affinity(sensory_needs: dict, project_env: dict) -> int:
    """
    Official Rural Minds Formula: sum(R * A) / n
    Normalized to 0-100%
    """
    # Mapping values to 1-3 scale (1=low/poor, 3=high/excellent)
    # Talent Needs (from Wizard: 1:Silencio/Restricted, 2:Mid, 3:Standard/Urbana)
    # We invert so 3 = High Need for specific adaptation
    t_needs_map = {1: 3, 2: 2, 3: 1} # Inverting Wizard IDs to Importance
    
    # Enterprise Adequacy (from strings or numbers)
    def map_adequacy(val):
        if isinstance(val, int): return val
        val = str(val).lower()
        if val in ["quiet", "natural", "soft", "async", "low", "high_adequacy"]: return 3
        if val in ["moderate", "standard", "brillo", "direct", "medium"]: return 2
        return 1 # loud, artificial_bright, verbal, mixed, high_stimulus
        
    factors = ["sound", "light", "communication", "social"]
    total_sum = 0
    n = len(factors)
    
    for factor in factors:
        t_val = sensory_needs.get(factor, 2) # Default to medium (2)
        # If t_val is 1-3 from Wizard, we map it to importance
        r = t_needs_map.get(t_val, 2)
        
        p_val = project_env.get(factor, "standard")
        a = map_adequacy(p_val)
        
        total_sum += (r * a)
        
    # Max sum = 4 factors * (3*3) = 36
    # Min sum = 4 factors * (1*1) = 4
    # Normalize to 0-100%
    # formula: (sum - min) / (max - min) * 100
    score = int(((total_sum - 4) / (36 - 4)) * 100)
    return min(100, max(0, score))
