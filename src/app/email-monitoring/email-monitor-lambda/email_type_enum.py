from enum import Enum


class EmailType(Enum):
    """
    Enumeration class for identifying which
    """
    COMPANY_INVITE = "company"
    ACCOUNTANT_FIRM_INVITE = "accountant firm"
    FIRM_CLIENTS = "access change"
