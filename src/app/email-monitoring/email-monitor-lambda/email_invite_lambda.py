import sys
import os
from email_type_enum import EmailType
from string_patterns_enum import StringPatterns

# To install dependencies within working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'package'))
from bs4 import BeautifulSoup
import re
import quopri
import boto3
import json
import requests


def decode_email(email_content_bytes: bytes) -> str | None:
    """
    Decodes the quoted-printable encoding of the email content bytes.

    :returns: the email body decoded as a string
    """
    decoded_content_bytes = quopri.decodestring(email_content_bytes)
    try:
        decoded_content = decoded_content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        decoded_content = decoded_content_bytes.decode('ISO-8859-1')
    return decoded_content


def find_company_name_in_from_field(content: str) -> bytes | None:
    """
    Extracts company's name from the content's from field.
    Assumes the from field line starts with the inviting company's name and ends with '(via Intuit Services)'.

    :param content: the content to extract from
    :returns: inviting party's company name, if found
    """
    match = re.search(StringPatterns.COMPANY_PATTERN_FROM.value, content)
    if match:
        company_name = match.group(1).strip()
        return company_name


def find_company_name_in_body(soup: BeautifulSoup) -> str | None:
    """
    Extracts company's name from the accepted soup object.
    Looks through all 'p' tags with text matching "access at" and pulls the expected following company name.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: name of the company, if found
    """
    all_p_tags = soup.find_all("p")
    for p_tag in all_p_tags:
        text = p_tag.get_text()
        if "changed your access at" in text:
            match = re.search(r'at\s(.*?)\s*:', text)
            if match:
                return match.group(1)


def find_sender_name(soup: BeautifulSoup) -> str | None:
    """
    Extracts inviting party's name from content.
    Looks through all 'p' tags for the first one with a <strong> tag and extracts the text within.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: inviting party's personal name, if found
    """
    for p_tag in soup.find_all('p'):
        strong_tag = p_tag.find('strong')
        if strong_tag:
            name = strong_tag.text.strip('""')
            return name


def find_invite_url(soup: BeautifulSoup) -> str | None:
    """
    Extracts invite url from content.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: the URL to accept invitation, if found
    """
    for a_tag in soup.find_all('a'):
        if a_tag.text == "Accept Invitation":
            return a_tag.get('href')


def extract_company_names_from_email(soup: BeautifulSoup) -> list | None:
    """
    Extracts list of company names from content.
    Looks for text "Granted access" encased in a 'strong' tag and extracts company names from the following <em> tags.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: the list of companies, if found
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


def identify_email_type(soup: BeautifulSoup) -> EmailType:
    """
    Identify the email type.
    Looks for specific words in the first <p> tag to identify which of the three email types has been received.

    :params soup: the BeautifulSoup object created from the email contents
    :returns: the corresponding enum representation of the email type
    """
    for p_tag in soup.find_all('p'):
        strong_tag = p_tag.find('strong')
        if strong_tag:
            if "accountant user" in p_tag.text:
                return EmailType.COMPANY_INVITE
            elif "new user" in p_tag.text:
                return EmailType.ACCOUNTANT_FIRM_INVITE
            else:
                return EmailType.FIRM_CLIENTS


def process_email_parsing(decoded_content: str, soup: BeautifulSoup, email_type: EmailType) -> dict:
    """
    Executes email parsing logic and logs the result.
    Identifies the email type based on a few keywords located in the email body and parses it based on the following
    data flow:
        Firm-clients type email:
            - Locates company's name in the <p> tag with the words "access at"
            - Locates keywords "Granted Access" in a <strong> tag and extracts company names from following <em> tags
        Company/Accountant-Invite type email:
            - Locates company/firm's name in the 'From:' field that also contains '(via Intuit Services)'
            - Locates sender's username from within the <strong> tag of a <p> tag
            - Locates invite URL from <a> tag with text "Accept Invitation"

    :param decoded_content: decoded email source code
    :param soup: email contents as a BeautifulSoup object
    :param email_type: one of three EmailType enum values
    :returns: a dictionary of the extracted values
    """
    data = {}
    if email_type == EmailType.FIRM_CLIENTS:
        company_name = find_company_name_in_body(soup)
        list_companies = extract_company_names_from_email(soup)
        data["firmName"] = company_name
        data["companyNames"] = list_companies
    else:
        company_name = find_company_name_in_from_field(decoded_content)
        sender_name = find_sender_name(soup)
        invite_url = find_invite_url(soup)
        if email_type == EmailType.COMPANY_INVITE:
            data["companyName"] = company_name
        else:
            data["firmName"] = company_name
        data["userName"] = sender_name
        data["_invite_link"] = invite_url
    print("Data extracted: ", data)  # Log data extraction
    return data


def process_s3_event(event):
    """
    Processes the S3 event triggered by S3 object creation.
    Retrieves the S3 Object listed in the event and extracts information from the email stored in S3.

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

    return decoded_content, soup


def execute_post_request(data: dict, email_type: EmailType):
    """
    Packages extracted data and makes a POST request to one of three API endpoint.

    :param data: extracted data as a dict
    :param email_type: one of three EmailType enums
    """
    if email_type == EmailType.COMPANY_INVITE:
        url = os.getenv("COMPANY_INVITE_API")
    elif email_type == EmailType.ACCOUNTANT_FIRM_INVITE:
        url = os.getenv("FIRM_INVITE_API")
    elif email_type == EmailType.FIRM_CLIENTS:
        url = os.getenv("FIRM_CLIENTS_API")
    else:
        url = ""
        print("Could not identify email type")
    headers = {
        'Content-Type': 'application/json',
        'Authorization': os.getenv("EMAIL_ENDPOINT_AUTH")
    }
    if data and url and headers:
        response = requests.post(url=url, headers=headers, data=json.dumps(data))
        if response.status_code == 200:
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Request was successful!', 'response': response.json()})
            }
        else:
            return {
                'statusCode': response.status_code,
                'body': json.dumps({'message': 'Request failed', 'error': response.text})
            }


def lambda_handler(event, context):
    """
    Lambda function handler. This is triggered by a S3 object creation event from SES receiving an email.

    :param event: The event data from S3
    :param context: The context for the Lambda function
    :returns: None
    """
    decoded_content, soup = process_s3_event(event)
    email_type = identify_email_type(soup)
    data = process_email_parsing(decoded_content, soup, email_type)
    return execute_post_request(data, email_type)


# For testing locally
def main():
    with open("email-invite-company", 'rb') as f:
        email_content_bytes = f.read()
        f.close()
    decoded_content = decode_email(email_content_bytes)
    soup = BeautifulSoup(decoded_content, "html.parser")
    email_type = identify_email_type(soup)
    data = process_email_parsing(decoded_content, soup, email_type)


if __name__ == '__main__':
    main()
