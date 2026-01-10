import re

# EARS Patterns
# Ubiquitous: The <system> shall...
# Event-driven: When <event>, the <system> shall...
# State-driven: While <state>, the <system> shall...
# Unwanted behavior: If <condition>, then the <system> shall...
# Optional feature: Where <feature>, the <system> shall...

EARS_PATTERNS = {
    "ubiquitous": re.compile(r"^The (.+) shall (.+)$", re.IGNORECASE),
    "event_driven": re.compile(r"^When (.+), the (.+) shall (.+)$", re.IGNORECASE),
    "state_driven": re.compile(r"^While (.+), the (.+) shall (.+)$", re.IGNORECASE),
    "unwanted_behavior": re.compile(r"^If (.+), then the (.+) shall (.+)$", re.IGNORECASE),
    "optional_feature": re.compile(r"^Where (.+), the (.+) shall (.+)$", re.IGNORECASE),
}

def verify_ears(title: str):
    """
    Verifies if a title matches one of the EARS patterns.
    Returns: (is_compliant, pattern_name, components)
    """
    for name, pattern in EARS_PATTERNS.items():
        match = pattern.match(title)
        if match:
            return True, name, match.groups()
    
    return False, None, None
