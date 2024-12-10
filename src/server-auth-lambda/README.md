# Synthetic Bookkeeper Lambda Info

## Code Structure

- src
  - services
    - quickbooks
      - account-selector
        - Functions used in selecting a firm during login
      - auth
        - Functions used for handling login authentication
    - browser
      - Helper class that condenses common groups of playwright functions into single functions to be called
    - email
      - Helper class that defines an email monitoring function across a series of functions.
  - types
    - Defines data types of the common groups of data values.
  - config
    - Defines env values and defines playwright selectors as callable constants.
  - lambda
    - Handles initial call, call type identification, and return values.
  - synthetic-login
    - Starts the synthetic login by creating the browser and other playwright / chromium setup.

## Docker Info

### Multi-stage Build Info

The docker build process is broken down into two stages, builder stage and final stage. A two-stage build allows the dependencies used in the first stage to be separate from the final image, reducing the size. Builder stage defines dependencies used in building the image, selects where to build the image, and creates and specifies the config file to be used. This stage is where the chromium binary that allows the system to work running inside a lambda function. The second stage copies over the existing build source code, then installs the os dependencies that are required to run the chrome binary. It then re-maps the lambda OS path to the home directory, as the chrome browser will attempt to write to this directory. Finally, we add something a lambda runtime emulator, which can be used to test lambda functions pre-deployment.

### Relevant Terminal Commands

### Aws Role Creation

PS C:\Users\user> aws config

PS C:\Users\user> @"
{
"Version": "2012-10-17",
"Statement": [
{
"Effect": "Allow",
"Principal": {
"Service": "lambda.amazonaws.com"
},
"Action": "sts:AssumeRole"
}
]
}"@ | Out-File -FilePath trust-policy.json -Encoding ASCII

PS C:\Users\user> aws iam create-role --role-name synthetic-auth-lambda-role --assume-role-policy-document file://trust-policy.json

### AWS Role Setup & ECR Repo Creation

PS C:\Users\user> $ROLE_ARN = aws iam get-role --role-name synthetic-auth-lambda-role --query Role.Arn --output text

PS C:\Users\user> aws iam attach-role-policy --role-name synthetic-auth-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

PS C:\Users\user> aws ecr create-repository --repository-name syntheticauth

### Docker Build

PS C:\Users\a\clasibot\src\server-auth-lambda> $Env:DOCKER_BUILDKIT = 0

PS C:\Users\a\clasibot\src\server-auth-lambda> docker build -t syntheticauth .

### AWS Login For Deployment

PS C:\Users\a> $ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

PS C:\Users\a> aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"

### Docker Deployment To AWS

PS C:\Users\a\clasibot\src\server-auth-lambda> docker tag syntheticauth:latest "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/syntheticauth:latest"

PS C:\Users\a\clasibot\src\server-auth-lambda> docker push "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/syntheticauth:latest"

### AWS Lambda Function Creation

PS C:\Users\a\clasibot\src\server-auth-lambda> aws lambda create-function `--function-name syntheticauth`
--package-type Image `--code ImageUri="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/syntheticauth:latest"`
--role $ROLE_ARN `--memory-size 2048`
--timeout 300

PS C:\Users\a\clasibot\src\server-auth-lambda> aws lambda create-function-url-config --function-name syntheticauth --auth-type NONE

### AWS Lambda Update Status Check & URL Get Command

PS C:\Users\a\clasibot\src\server-auth-lambda> aws lambda update-function-code --function-name syntheticauth --image-uri "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/syntheticauth:latest"

PS C:\Users\a\clasibot\src\server-auth-lambda> aws lambda get-function-url-config --function-name syntheticauth

# Env.Example

## Clasibot email credentials used for email monitoring.

EMAIL_PASSWORD=
EMAIL_USER=

## IMAP host and port used for email monitoring.

IMAP_HOST=
IMAP_PORT=

## Url visited when preforming synthetic login (not invite accepting which uses passed url).

LOGIN_URL=

## Quickbooks synthetic bookkeeper credentials.

QB_EMAIL_ADDRESS=
QB_PASSWORD=
