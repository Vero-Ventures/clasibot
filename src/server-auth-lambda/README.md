# Synthetic Bookkeeper Lambda Info

## Code Structure

- src
  - services
    - quickbooks
      - account-selector
        - this is a helper class for the quickbooks account selection process
      - auth
        - helper class for performing the auth flow on quickbooks
    - browser
      - this helper class is used to clean up the main script by condensing playwright methods commonly used together into single methods to be called
    - email
      - this is the helper class that contains all logic related to IMAP protocol, used to connect to the email inbox and parse the auth codes needed
  - types
    - self explanatory
  - config
    - this file is used to co-locate all env variables, playwright selectors for html elements, etc.
  - lambda
    - This could be merged with synthetic login, but this is the file where we define the synthetic login process and a lambda handler.
  - synthetic-login
    - this is the actual main script to perform the process

## Docker Info

I will add comments to the dockerfile to explain things better, but here I will give a general overview of what is happening during the build.

### Multi-stage Build Info

The docker build process is broken down into two stages, builder stage and final stage.The builder stage is where we build/compile source code + dependencies. One advantadge of multi-stage builds is that we can start fresh in the second stage without build dependencies, and we can just copy over the built files from the build stage to the second stage. I mostly did this to reduce the final image size but it likely didn't matter much since the web browser accounts for almost all of it.

### Builder Stage

As mentioned, here we are building our source code to be later copied over. Since my lambda build and the nextjs app had conflicting needs in terms of typescript compilation to js, I had to specify different instructions for that process. Since adding another tsconfig file to the repo in this subdirectory caused issues, I had to manually specify build instructions, which is why the build process in lines 8-16 looks much more complex than it normally would.

One dependency installed here that you should be familiar with is @sparticuz/chromium. This is a specially modified chrome binary made to be runnable in lambda or other serverless environments. Regular browser binaries that come with playwright or anything else will cause a near instant crash in a lambda function so this is an essential piece.

### Final Stage

In this stage we copy over built source code, and then install all the os dependencies that are required to run the chrome binary.

After that we remap the lambda OS path to the home directory. This is done as chrome, or any other browser, will attempt to write to this directory. Since lambda is configured to have HOME be read-only, writing to it will cause the lambda to crash. We instead map HOME to ./tmp directory which can be written to without issue.

Finally at the end, we add something called lambda runtime emulator, which can be used to test lambda functions pre-deployment. I used a shell script as the container entrypoint, ("entrypoint.sh"). This just detects if the container is being run locally or in AWS and if locally, it uses the lambda emulator I mentioned.

## Deployment/IaC - Serverless

I have added "Serverless" as a bun dependency in this subdirectory to handle deployment and teardown of all synthetic auth related AWS resources ([docs can be found here](https://www.serverless.com/framework/docs)). All the deployment instructions are contained in a single yaml file, "serverless.yml", located in root of this subdirectory.

### Requirements to use Serverless

- Install serverless + all other dependencies contained in package.json of this subdirectory
- AWS account
  - serverless will prompt you to provide AWS access key and secret key on first use, [info on how to get these keys from AWS can be found here in the serverless docs](https://www.serverless.com/framework/docs/providers/aws/guide/credentials)
- Serverless account
  - serverless will also prompt you to login/register with them on first use.
  - It is a free account and they provide a dashboard which could potentially be useful, so not a big deal.
- Docker
  - for building the docker container locally prior to pushing it to AWS. This will be abstracted away by serverless but the dependency is needed.

### Relevant Terminal Commands

###### I have added some scripts to the lambda directory package.json file for ease of use. Below are the ones I added and some info about usage.

To deploy the lambda resources to AWS, navigate to ./src/server-auth-lambda and run:

`bun run deploy`

This command is used for both the initial deployment w/ resource creation on AWS and any subsequent deployments of updated code to those resources.

To remove all deployed resources from AWS, navigate to the same directory and run:

`bun run remove`

To see the current configuration of the service (useful if you want to verify that env variables are loaded in properly), run:

`bun run print`

If you want to handle serverless account registration/login prior to running the deployment command, run:

`bun run login`

There are some more additional cli commands that you may find useful [here](https://www.serverless.com/framework/docs/providers/aws/cli-reference). These can all be run by typing bun run serverless {insert rest of command}.

## Issues

As mentioned before, I had encountered issues in previous versions of this code while attempting to use bun instead of npm for the lambda function. There may be workarounds to use or patches coming, but from the research I did it seems that it is best to use npm for now. If you want to get bun to work, you will need to alter the npm/npx commands in the dockerfile if you haven't already.
