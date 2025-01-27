import sys
import os
from email_type_enum import EmailType
from string_patterns_enum import StringPatterns

# To install dependencies within working directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'package'))
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from typing import List

import boto3
import json
import quopri
import re
import requests


load_dotenv()


def decode_email(email_content_bytes: bytes) -> str | None:
    """
    Decodes the quoted-printable encoding of the email content bytes.

    :param email_content_bytes: the email content after conversion into bytes
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
    Looks through all <td> tags with text matching expected string, and pulls the expected following company name.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: name of the company, if found
    """
    all_td_tags = soup.find_all("td")
    for td_tag in all_td_tags:
        text = td_tag.get_text()
        if "changed your access at" in text:
            match = re.search(r'at\s(.*?)\s*:', text)
            if match:
                return match.group(1)


def find_sender_name(soup: BeautifulSoup) -> str | None:
    """
    Extracts inviting party's name from content.
    Looks through all <p> tags for the first one with a <strong> tag and extracts the text within.

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
    Looks for <td> tags with italic font style and extracts company names.

    :param soup: the BeautifulSoup object created from the email contents
    :returns: the list of companies, if found
    """
    company_names = []
    for italic_data in soup.find_all('td', attrs={'style': True}):
        if 'font-style:italic;' in italic_data.attrs['style']:
            company_names.append(italic_data.get_text(strip=True))
    cleaned_company_names = [name.lstrip('to ').strip() for name in company_names]
    return cleaned_company_names

def identify_email_type(soup: BeautifulSoup) -> EmailType:
    """
    Identify the email type.
    Looks for specific words in the first <p> tag to identify possible invite type emails.
    Looks for <td> tags with the style font-weight:bold to identify client access updates.
    Uses the text inside that <td> tag to then determines the update type (add or remove).

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
    for bold_data in soup.find_all('td', attrs={'style': True}):
        if 'font-weight:bold;' in bold_data.attrs['style']:
            if "granted access" in bold_data.text.lower():
                return EmailType.ADD_FIRM_CLIENTS
            if "removed access" in bold_data.text.lower():
                return EmailType.REMOVE_FIRM_CLIENTS


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
    if email_type == EmailType.ADD_FIRM_CLIENTS:
        company_name = find_company_name_in_body(soup)
        list_companies = extract_company_names_from_email(soup)
        data["firmName"] = company_name
        data["companyNames"] = list_companies
        data["changeType"] = 'added'
    elif email_type == EmailType.REMOVE_FIRM_CLIENTS:
        company_name = find_company_name_in_body(soup)
        list_companies = extract_company_names_from_email(soup)
        data["firmName"] = company_name
        data["companyNames"] = list_companies
        data["changeType"] = 'removed'
    else:
        company_name = find_company_name_in_from_field(decoded_content)
        sender_name = find_sender_name(soup)
        invite_url = find_invite_url(soup)
        if email_type == EmailType.COMPANY_INVITE:
            data["companyName"] = company_name
        else:
            data["firmName"] = company_name
        data["userName"] = sender_name
        data["inviteLink"] = invite_url
    return data


def process_s3_event(event):
    """
    Processes the S3 event triggered by S3 object creation.
    Retrieves the S3 Object listed in the event and extracts information from the email stored in S3.

    :param event: the event data from SES triggering Lambda
    :returns: the decoded email content and BeautifulSoup object of the decoded content
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

    :param data: a dict of the extracted data to be sent
    :param email_type: one of three EmailType enums
    :return: a request status code and relevant body
    """
    if email_type == EmailType.COMPANY_INVITE:
        url = os.getenv("COMPANY_INVITE_API")
    elif email_type == EmailType.ACCOUNTANT_FIRM_INVITE:
        url = os.getenv("FIRM_INVITE_API")
    elif email_type == EmailType.ADD_FIRM_CLIENTS or email_type == EmailType.REMOVE_FIRM_CLIENTS:
        url = os.getenv("FIRM_CLIENTS_API")
    else:
        url = ""
        print("Could not identify email type")
    headers = {
        'Content-Type': 'application/json'
    }
    if not data or not url or not headers:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Invalid input: data, url, and headers are required'})
        }
    
    monitor_auth = os.getenv("EMAIL_ENDPOINT_AUTH")
    data['monitorAuth'] = monitor_auth

    try:
        response = requests.post(url=url, headers=headers, data=json.dumps(data))
        if response.status_code == 200:
            return {
                'statusCode': 200,
                'body': response.text
            }
        else:
            return {
                'statusCode': response.status_code,
                'body': response.text
                }
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'An error occurred while making the POST request',
                'error': str(e)
            })
        }


def lambda_handler(event, context):
    """
    Lambda function handler. This is triggered by a S3 object creation event from SES receiving an email.

    :param event: The event data from S3
    :param context: The context for the Lambda function
    :returns: A request status code and relevant body
    """
    decoded_content, soup = process_s3_event(event)
    email_type = identify_email_type(soup)
    data = process_email_parsing(decoded_content, soup, email_type)
    return execute_post_request(data, email_type)

