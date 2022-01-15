# Home Monitoring API
## Introduction
This is the backend REST API for my home monitoring system.

I'm building it to record time-series data from various sensors and
to receive SMS alerts for situations like low temperatures or water leaks.

The API is built with the serverless framework and is designed to run on AWS
using Lambda functions and DynamoDB for the database.

## Setup
1. You will need an AWS account.
1. Create an IAM user on AWS with programmatic access
1. Add your IAM user access keys to your aws `credentials` file.  
    See https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
1. Create a `.env` file with the following environment variables:
    ```bash
    # This will be used as a prefix for resources added to your AWS account
    APP_NAME=home-monitor

    # AWS profile name from your ~/.aws/credentials file
    # This is the profile that will be used to deploy the serverless API
    IAM_PROFILE=your-iam-profile-name

    # URL where you will access the API from
    DOMAIN=https://home-monitor-api.example.com

    # URL used for local testing
    DEV_DOMAIN=http://localhost:3000

    # Open Weather Map API is used for getting outside temperature
    OPEN_WEATHER_MAP_API_KEY=abc123...

    # Latitude and longitude is needed for getting outside temperature
    LATITUDE=50
    LONGITUDE=-104
    ```
1. Install NodeJS and NPM: https://nodejs.org/en/download/
1. Install the serverless framework  
    ```
    npm i -g serverless
    ```
1. Install other dependencies  
    ```
    npm i
    ```
1. Initialize the models submodule
    ```bash
    git submodule add git@github.com:DeanKertai/home-monitor-models.git src/models
    ```

## Deploying
After completing the setup instructions above, you can deploy the API to
your AWS account by running the `deploy` script.  
This will ask you to create an admin password, which will be used for
authenticating access to the API. See the Authentication section below
```
npm run deploy
```

## Authentication
`WARNING`: The authentication scheme used for this API is very weak and
should not be used in any kind of production environment. If you're using
this as a template for building a production serverless API you should use
something like Auth0 or AWS Cognito.  

When you run the `deploy` script for the first time, it will ask you to 
create an admin password. This password will be hashed and salted with
bcrypt, and saved to a a environment variable file called `generated.env`
along with a randomly generated JWT secret. For example:
```
HASHED_PASSWORD=$2b$10$LTUvSP...
JWT_SECRET=114903af53504513a32f1...
```
If you want to change the password, just delete `generated.env` and
re-deploy. This will also invalidate any issued JWTs because of the new secret

Dashboard users and sensors can authenticate by posting the password to 
`/auth`:
```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"password":"example"}' \
  https://home-monitor-api.example.com/auth
```
This will return a signed JWT
