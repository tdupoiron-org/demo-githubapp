"""Module to create a repository"""
import os
import requests

github_token = os.environ["DEMO_GITHUB_TOKEN"]
repo_name = os.environ["DEMO_GITHUB_REPO_NAME"]
repo_owner = os.environ["DEMO_GITHUB_REPO_OWNER"]

# Create a repository
url = "https://api.github.com/orgs/" + repo_owner + "/repos"

headers = {
    "Authorization": "Bearer " + github_token,
}

data = {
    "name": repo_name
}

response = requests.post(url, headers=headers, json=data, timeout=5)
print(response.text)
