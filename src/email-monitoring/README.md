# Email Processing Dataflow with AWS SES, S3, and Lambda

This document provides an overview of the dataflow for processing emails with AWS services, along with important details and key points you can find on their respective AWS service pages.

---

## Dataflow Overview

1. **AWS SES**: Receives emails at the approved domain.
2. **Amazon S3**: Stores the received email as an object in a designated bucket.
3. **AWS Lambda**: Automatically triggers upon the creation of the email object in the S3 bucket to process the email.

---

## Service Details and Pages to Note

### 1. **AWS Simple Email Service (SES)**

- **Purpose**: Handles the receipt of emails to the domain you own and have verified.
- **[Redirecting mail to SES](https://docs.aws.amazon.com/ses/latest/dg/receiving-email-mx-record.html)**:
  - Add MX record in DNS settings of the preferred DNS registrar.
  - Note the different AWS SES inbound mail values for different regions depending on which region you have SES setup.
- **[Domain Verification](https://docs.aws.amazon.com/ses/latest/dg/receiving-email-verification.html)**:
  - Steps to verify your domain for email receiving.
  - Note DKIM DNS configurations for domain verification (CNAME records).
- **[Email Receiving Rules](https://docs.aws.amazon.com/ses/latest/dg/receiving-email.html)**:
  - Configure receipt rules to define the processing of incoming emails (e.g., forwarding emails to S3).
    - Ensure the IAM role attached to AWS SES has permissions to write to S3.
  - Set up filters (e.g., allow specific senders).

---

### 2. **Amazon Simple Storage Service (S3)**

- **Purpose**: Stores the received email as an object for further processing.
  - **[Bucket Policies and Permissions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)**:
    - Allows for fine grained control over bucket acccess.
    - Note the bucket policy currently disallows deletion of objects with prefix /protected-path/ within the existing bucket.
  - **[Lifecycle Rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)**:
    - Manage the lifecycle of email objects (e.g., delete after a set time).
      - Currently set to delete objects after three weeks following creation.
  - **[S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)**:
    - S3 event notifications enable automatic triggering of Lambda functions when specific events occur in the bucket, such as the creation of a new email object.
    - Ensure the Lambda function has the necessary permissions to be invoked by S3 (IAM role/policy setup).

---

### 3. **AWS Lambda**

- **Purpose**: Processes the email object upon its creation in the S3 bucket.

  - **[Function Trigger Setup](https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html)**:
    - Details on setting S3 as an event source for Lambda.
    - Event configuration steps for automatic triggering.
  - **[IAM Permissions](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)**:
    - Grant Lambda permissions to read from the S3 bucket.
  - **[Logging and Monitoring](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html)**:

    - Use AWS CloudWatch to monitor execution, errors, and performance.
      - Can be located in "Monitor tab" or search for CloudWatch -> Click on Log Groups in the side menu -> Click on the desired Lambda to view its logs

  - **[Lambda Execution Context](https://docs.aws.amazon.com/lambda/latest/dg/running-lambda-code.html)**:
    - Information on how to optimize the function for handling large email objects or attachments.

---

## Additional Notes

1. **Integration Best Practices**:

- Ensure services are in the same AWS region for reduced latency and cost efficiency.

2. **Cost Considerations (As of 11/30/2024)**:

- **Free Tier Limitations**:
  - **SES**: First 12 months free for 3,000 messages per month (including outbound emails, inbound emails, and Virtual Deliverability Manager outbound email processing).
  - **S3 Standard**: First 12 months free for 5GB standard storage class (Limitations: 20k Get requests; 2k Put requests).
  - **Lambda**: 1 million free requests per month for free always (Up to 400,000 GB-seconds or 3.2 million seconds of compute time per month).
- **Cost Beyond Free Tier**:
  - **SES**: Inbound email - $0.10/1000 emails
  - **S3 Standard**: $0.005/1000 PUT, COPY, POST, LIST requests; $0.0004/1000 GET, SELECT, and all other requests.
  - **Lambda**: First 6 Billion GB-seconds/month: $0.0000166667 for every GB-second and $0.20 per 1M requests.

3. **AWS IaC**

- Cloudformation template of the email-monitoring AWS infrastructure primarily comprised of AWS SES, S3, and Lambda was generated on 12/03/2024
  - The generated template was not pushed to the repo due to potential security concerns but is accessible in the account under "templates" in Cloudformation > IaC Generator
---