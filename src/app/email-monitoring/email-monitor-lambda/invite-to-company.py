import sys
import os

# To install dependencies within working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'package'))
from bs4 import BeautifulSoup
import re
import quopri
from enum import Enum


class StringPatterns(Enum):
    """
    Enumeration class for storing string patterns to extract data with using module 're'
    """
    # Pattern for company's name in 'Subject' line up until it ends with a hyphen and white space
    COMPANY_PATTERN = r'Subject:\s(.*?)(?=\s*-\s*)'
    # Pattern for a typical email pattern (e.g. XXXXXX@XXXXXX.XXX
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    # Pattern looking for URL in href attribute
    URL_PATTERN = r'href=3D"([^"]+)"'


def decode_email():
    """
    Opens the accepted email in binary and decodes the quoted-printable encoding

    :returns: the email body decoded
    """
    # Read the email content as bytes
    with open("email-invite-company", 'rb') as f:
        email_content_bytes = f.read()
        # Decode the quoted-printable encoding
        decoded_content_bytes = quopri.decodestring(email_content_bytes)
        try:
            decoded_content = decoded_content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            decoded_content = decoded_content_bytes.decode('ISO-8859-1')
        f.close()
        return decoded_content


def find_company_name(content):
    """
    Extracts company's name from the accepted content via string matching with COMPANY_PATTERN
    Args:
        content: the content to extract from

    Returns: inviting party's company name, if found
    """
    match = re.search(StringPatterns.COMPANY_PATTERN.value, content)
    if match:
        sender_name = match.group(1).strip()
        return sender_name


def find_sender_email(soup):
    """
    Extracts inviting party's email address from content
    Looks for a 'p' tag with text "has invited you to" within and extracts the expected preceeding email address
    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: the inviting party's email, if found
    """
    all_p_tags = soup.find_all("p")
    for p_tag in all_p_tags:
        if "has invited you to" in p_tag.get_text():
            invite_text = p_tag.get_text()
            match = re.search(StringPatterns.EMAIL_PATTERN.value, invite_text)
            if match:
                sender_email = match.group()
                return sender_email


def find_sender_name(soup):
    """
    Extracts inviting party's name from content
    Looks through all 'p' tags for the first one with a 'strong' tag and extracts the text within
    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: inviting party's personal name, if found
    """
    for p_tag in soup.find_all('p'):
        strong_tag = p_tag.find('strong')
        if strong_tag:
            name = strong_tag.text.strip('""')
            return name


def find_invite_url(soup):
    """
    Extracts invite url from content
    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: the URL to accept invitation, if found

    """
    for a_tag in soup.find_all('a'):
        if a_tag.text == "Accept Invitation":
            return a_tag.get('href')


def extract_company_names_from_email(soup):
    """
    Extracts list of company names from content
    Looks for text "Granted access" encased in a 'strong' tag and extracts company names from the following 'em' tags
    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: the list of companies, if found
    """
    company_names = []
    for strong_tag in soup.find_all('strong'):
        if "Granted access" in strong_tag.text:
            # Find all <em> tags following the "Granted access" <strong> tag
            for sibling in strong_tag.find_next_siblings():
                if sibling.name != 'em':
                    break
                company_names.append(sibling.get_text(strip=True))
            cleaned_company_names = [name.lstrip('to ').strip() for name in company_names]
            return cleaned_company_names


def main():
    decoded_content = decode_email()
    soup = BeautifulSoup(decoded_content, "html.parser")
    print(f"Sender's company: {find_company_name(decoded_content)}")
    print(f"Sender's name: {find_sender_name(soup)}")
    print(f"Sender's email: {find_sender_email(soup)}")
    print("Decoded URL:", find_invite_url(soup))
    print(f"Company's with access changes: {extract_company_names_from_email(soup)}")


if __name__ == '__main__':
    main()
