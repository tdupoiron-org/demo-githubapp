"""Module to generate a GitHub App token for a specific installation"""
import json
import os
import time
import requests
import jwt

signing_key = os.environ["DEMO_GITHUBAPP_PRIVATE_KEY"]
appId = os.environ["DEMO_GITHUBAPP_APPID"]
installationId = os.environ["DEMO_GITHUBAPP_INSTALLATIONID"]

payload = {
    'iat': int(time.time()),
    'exp': int(time.time()) + 600, 
    'iss': appId
}

# Create JWT
ENCODED_JWT = jwt.encode(payload, signing_key, algorithm='RS256')

# Get the app installations
URL = "https://api.github.com/app/installations"
headers = {
    "Authorization": "Bearer " + ENCODED_JWT
}
response = requests.get(URL, headers=headers, timeout=5)
installations = json.loads(response.text)

# Get the installation access token
URL = "https://api.github.com/app/installations/" + str(installationId) + "/access_tokens"

response = requests.post(URL, headers=headers, timeout=5)
access_token = json.loads(response.text)["token"]

print('::set-output name=token::' + access_token)
