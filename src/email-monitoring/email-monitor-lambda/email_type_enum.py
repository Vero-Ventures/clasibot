from enum import Enum


class EmailType(Enum):
    """
    Enumeration class for identifying which
    """
    COMPANY_INVITE = "company"
    ACCOUNTANT_FIRM_INVITE = "accountant firm"
    ADD_FIRM_CLIENTS = "access addition"
    REMOVE_FIRM_CLIENTS = "access removal"
