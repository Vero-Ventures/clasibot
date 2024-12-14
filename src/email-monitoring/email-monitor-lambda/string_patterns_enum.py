from enum import Enum


class StringPatterns(Enum):
    """
    Enumeration class for storing string patterns to extract data with using module 're'.
    """
    # Pattern for company's name in 'From' line up until it ends with a hyphen and white space
    COMPANY_PATTERN_FROM = r'From: "([^"]+)\s\(via Intuit services\)'
    
    # Pattern for company's name in body - expects the company's name to follow text "at" and ends with a colon
    COMPANY_PATTERN_BODY = r'at\s(.*?)\s*:'

    # Pattern for a typical email pattern (e.g. XXXXXX@XXXXXX.XXX)
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'

    # Pattern looking for URL in href attribute
    URL_PATTERN = r'href=3D"([^"]+)"'
