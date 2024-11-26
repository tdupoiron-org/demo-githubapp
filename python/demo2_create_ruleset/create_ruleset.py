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

# List rulesets in the org
# Call URL https://api.github.com/orgs/ORG/rulesets with org = tdupoiron-org
URL = "https://api.github.com/orgs/tdupoiron-org/rulesets"
headers = {
    "Authorization": "Bearer " + access_token
}
response = requests.get(URL, headers=headers, timeout=5)
rulesets = json.loads(response.text)
#print(rulesets)

# Create a new ruleset in the org
URL = "https://api.github.com/orgs/tdupoiron-org/rulesets"
headers = {
    "Authorization": "Bearer " + access_token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}
data = {
    "name": "super cool ruleset",
    "target": "branch",
    "enforcement": "active",
    "conditions": {
        "ref_name": {
            "include": [
                "refs/heads/main",
                "refs/heads/master"
            ],
            "exclude": [
                "refs/heads/dev*"
            ]
        },
        "repository_name": {
            "include": [
                "important_repository",
                "another_important_repository"
            ],
            "exclude": [
                "unimportant_repository"
            ],
            "protected": True
        }
    },
    "rules": [
        {
            "type": "commit_author_email_pattern",
            "parameters": {
                "operator": "contains",
                "pattern": "github"
            }
        }
    ]
}
response = requests.post(URL, headers=headers, data=json.dumps(data), timeout=5)
ruleset = json.loads(response.text)
print(ruleset)