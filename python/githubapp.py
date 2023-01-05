### STEP 1 : Generate a JWT

import jwt
import time 
import sys
import os

signing_key = os.environ["DEMO_GITHUBAPP_PRIVATE_KEY"]
appId = os.environ["DEMO_GITHUBAPP_APPID"]

payload = {
    # Issued at time
    'iat': int(time.time()),
    # JWT expiration time (10 minutes maximum)
    'exp': int(time.time()) + 600, 
    # GitHub App's identifier
    'iss': appId
}
    
# Create JWT
encoded_jwt = jwt.encode(payload, signing_key, algorithm='RS256')

### STEP 2 : Use the JWT to get the app installations

import requests
import json

# Get the app installations
url = "https://api.github.com/app/installations"
headers = {
    "Authorization": "Bearer " + encoded_jwt
}
response = requests.get(url, headers=headers)
installations = json.loads(response.text)

### STEP 3 : For each installation, get the installation access token and list organization repositories

for installation in installations:

    installation_id = installation["id"]
    organization = installation["account"]["login"]

    print("Installation ID: ", installation_id)
    print("Organization: ", organization)

    # Get the installation access token
    url = "https://api.github.com/app/installations/" + str(installation_id) + "/access_tokens"
    headers = {
        "Authorization": "Bearer " + encoded_jwt,
    }
    response = requests.post(url, headers=headers)
    access_token = json.loads(response.text)["token"]

    print ("Access token: ", access_token)

    # List organization repositories
    url = "https://api.github.com/orgs/" + organization + "/repos"
    headers = {
        "Authorization": "token " + access_token,
    }
    response = requests.get(url, headers=headers)
    repositories = json.loads(response.text)

    for repository in repositories:
        print("Repository: ", repository["full_name"], "(", repository["visibility"], ")")