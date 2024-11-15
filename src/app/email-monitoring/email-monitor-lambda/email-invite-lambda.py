import sys
import os
# To install dependencies within working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'package'))
from bs4 import BeautifulSoup
import re
import quopri
from enum import Enum
import boto3


class StringPatterns(Enum):
    """
    Enumeration class for storing string patterns to extract data with using module 're'.
    """
    # Pattern for company's name in 'From' line up until it ends with a hyphen and white space
    COMPANY_PATTERN_FROM = r'From: "([^"]+)\s\(via Intuit services\)'
    # Pattern for company's name in body - expects the company's name to following text "access at" within a p tag,
    # ending with a colon
    COMPANY_PATTERN_BODY = r'at\s(.*?)\s*:'
    # Pattern for a typical email pattern (e.g. XXXXXX@XXXXXX.XXX)
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    # Pattern looking for URL in href attribute
    URL_PATTERN = r'href=3D"([^"]+)"'


def decode_email(email_content_bytes):
    """
    Decodes the quoted-printable encoding of the email content bytes.

    Args:
        email_content_bytes: bytes content of the email

    Returns: the email body decoded as a string
    """
    decoded_content_bytes = quopri.decodestring(email_content_bytes)
    try:
        decoded_content = decoded_content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        decoded_content = decoded_content_bytes.decode('ISO-8859-1')
    return decoded_content


def find_company_name_in_from_field(content):
    """
    Extracts company's name from the content's from field via string matching with StringPatterns.COMPANY_PATTERN.
    Assumes the from field line starts with the inviting company's name and ends with empty space and a hyphen.
    Args:
        content: the content to extract from

    Returns: inviting party's company name, if found
    """
    match = re.search(StringPatterns.COMPANY_PATTERN_FROM.value, content)
    if match:
        company_name = match.group(1).strip()
        # Rejects if the email has "Fwd" in from field line
        if "Fwd" in company_name:
            return None
        return company_name


def find_company_name_in_body(soup):
    """
    Extracts company's name from the accepted soup object.
    Looks through all 'p' tags with text matching "access at" and pulls the expected following company name.

    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: name of the company, if found
    """
    all_p_tags = soup.find_all("p")
    for p_tag in all_p_tags:
        text = p_tag.get_text()
        if "changed your access at" in text:
            match = re.search(r'at\s(.*?)\s*:', text)
            if match:
                return match.group(1)


def find_sender_email(soup):
    """
    Extracts inviting party's email address from content.
    Looks for a 'p' tag with text "has invited you to" within and extracts the expected preceding email address.

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
    Extracts inviting party's name from content.
    Looks through all 'p' tags for the first one with a 'strong' tag and extracts the text within.

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
    Extracts invite url from content.

    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: the URL to accept invitation, if found

    """
    for a_tag in soup.find_all('a'):
        if a_tag.text == "Accept Invitation":
            return a_tag.get('href')


def extract_company_names_from_email(soup):
    """
    Extracts list of company names from content.
    Looks for text "Granted access" encased in a 'strong' tag and extracts company names from the following 'em' tags.

    Args:
        soup: the BeautifulSoup object created from the email contents

    Returns: the list of companies, if found
    """
    company_names = []
    for strong_tag in soup.find_all('strong'):
        if "Granted access" in strong_tag.text:
            for sibling in strong_tag.find_next_siblings():
                if sibling.name != 'em':
                    break
                company_names.append(sibling.get_text(strip=True))
            cleaned_company_names = [name.lstrip('to ').strip() for name in company_names]
            return cleaned_company_names


def process_s3_event(event):
    """
    Processes the S3 event triggered by SES.
    Retrieves the S3 Object listed in the SES event and extracts information from the email stored in S3.

    :param event: The event data from SES triggering Lambda
    :returns: None
    """
    # Get the S3 bucket and object key from the event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    # Initialize S3 client
    s3_client = boto3.client('s3')

    # Fetch the email content from S3
    response = s3_client.get_object(Bucket=bucket, Key=key)
    email_content_bytes = response['Body'].read()

    # Decode the email content
    decoded_content = decode_email(email_content_bytes)
    soup = BeautifulSoup(decoded_content, "html.parser")

    # Log extracted information
    print(f"Sender's company: {find_company_name_in_from_field(decoded_content) or find_company_name_in_body(soup)}")
    print(f"Sender's name: {find_sender_name(soup)}")
    print(f"Sender's email: {find_sender_email(soup)}")
    print(f"Decoded URL: {find_invite_url(soup)}")
    print(f"Company's with access changes: {extract_company_names_from_email(soup)}")


def lambda_handler(event, context):
    """
    Lambda function handler. This is triggered by SES email receiving events.

    :param event: The event data from SES
    :param context: The context for the Lambda function
    :returns: None
    """
    process_s3_event(event)
    return {
        'statusCode': 200,
        'body': 'Processed successfully'
    }


# For testing locally
def main():
    with open("email-invite-accountant", 'rb') as f:
        email_content_bytes = f.read()
        f.close()
    decoded_content = decode_email(email_content_bytes)
    soup = BeautifulSoup(decoded_content, "html.parser")
    print(f"Sender's company: {find_company_name_in_from_field(decoded_content) or find_company_name_in_body(soup)}")
    print(f"Sender's name: {find_sender_name(soup)}")
    print(f"Sender's email: {find_sender_email(soup)}")
    print("Decoded URL:", find_invite_url(soup))
    print(f"Company's with access changes: {extract_company_names_from_email(soup)}")


if __name__ == '__main__':
    main()
