###### The following currently assumes AWS CLI is already set up locally, and you have an AWS account with the necessary credentials to use CLI ######


#### Instructions for setting up AWS Lambda via CLI ####
## Create Lambda function ##
```sh
aws lambda create-function \
--function-name accept-email-invite \
--role "iam-role-arn" \
--runtime nodejs20.x \
--zip-file fileb://lambda-function.zip \
--handler lambda-function/accept-invite.handler
```

## Grant Lambda permissions to access SES ##
```sh
aws lambda add-permission \
--function-name accept-email-invite \
--principal ses.amazonaws.com \
--statement-id lambda-to-ses-permissions \
--action "lambda:InvokeFunction"
```

###### Instructions for setting up AWS SES via CLI ######
### Link email address to AWS SES ###
```sh
aws sesv2 create-email-identity --email-identity <'insert-email-to-monitor'>
```
# Email confirmation to link email will be sent upon running the above command - accept request to authorize and proceed

### (1) Create receipt rule set to manage incoming emails, (2) apply rule set to SES, (3) and activate the rule set###
## See ./accept-invite-rule-set.json for the policy
```sh
aws ses create-receipt-rule-set --rule-set-name accept-invite-rule-set
aws ses create-receipt-rule --rule-set-name accept-invite-rule-set --rule file://accept-invite-rule-set.json
aws ses set-active-receipt-rule-set --rule-set-name accept-invite-rule-set
```