from enum import Enum


class EmailType(Enum):
    """
    Enumeration class for strings used in identifying Email invite / update type.
    """
    COMPANY_INVITE = "company"
    ACCOUNTANT_FIRM_INVITE = "accountant firm"
    FIRM_CLIENTS = "access change"
