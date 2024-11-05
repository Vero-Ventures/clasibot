import sys
import os

# Necessary to guarantee
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'package'))

import json
import boto3
import email
import re
from bs4 import BeautifulSoup
from urllib.parse import unquote


def lambda_handler(event, context):
    s3 = boto3.client('s3')
    print(f'event:{event}')
    try:
        # Retrieve S3 object based on bucket name and key
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = unquote(event['Records'][0]['s3']['object']['key'])
        response = s3.get_object(Bucket=bucket, Key=key)

        # Parse email body contents
        email_content = response['Body'].read().decode('utf-8')
        msg = email.message_from_string(email_content)
        html_content = None
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                html_content = part.get_payload(decode=True).decode()
                break
        
        if not html_content:
            raise Exception("No HTML content found in email")

        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')

        # Find the paragraph containing the email and company info
        info_paragraph = soup.find('p', string=lambda text: text and 'has invited you to join' in text)
        if not info_paragraph:
            raise Exception("Could not find invitation information")

        # Extract email and company name
        info_text = info_paragraph.get_text().strip()
        email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', info_text)
        company_match = re.search(r'join (.*?) as', info_text)

        # Find the invitation link
        invite_link = soup.find('a', string=lambda text: text and 'Accept Invitation' in text)
        if not invite_link:
            raise Exception("Could not find invitation link")

        # Construct the result
        result = {
            'inviter_email': email_match.group(1) if email_match else None,
            'company_name': company_match.group(1) if company_match else None,
            'invitation_url': invite_link.get('href')
        }

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error processing email: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

if __name__ == "__main__":
    # Dummy mock event for testing local environment - does not mimic actual expected input
    mock_event = {
        "Records": [
            {
                "s3": {
                    "bucket": {
                        "name": "test-lambda-bucket-mho"
                    },
                    "object": {
                        "key": "01543pe5g2n3cv4hhuip9mgrde528gce6g6pt801"
                    }
                }
            }
        ]
    }
    response = lambda_handler(mock_event, None)
    print(response)