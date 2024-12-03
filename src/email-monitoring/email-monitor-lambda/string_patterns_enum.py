from enum import Enum


class StringPatterns(Enum):
    """
    Enum for identifing string patterns used in Email data extraction with using 're' module.
    """
    # Pattern: Company's name in 'From' line, up until it ends with a hyphen and white space.
    COMPANY_PATTERN_FROM = r'From: "([^"]+)\s\(via Intuit services\)'

    # Pattern: Company's name in body - expects the Company's name to follow text "at" and ends with a colon.
    COMPANY_PATTERN_BODY = r'at\s(.*?)\s*:'
    
    # Pattern: typical Email address. (e.g. XXXXXX@XXXXXX.XXX)
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'

    # Pattern:  URL in href attribute.
    URL_PATTERN = r'href=3D"([^"]+)"'
