#!/bin/bash

GITHUB_PRIVATE_KEY=$DEMO_GITHUBAPP_PRIVATE_KEY
GITHUB_APP_ID=$DEMO_GITHUBAPP_APPID

NOW=$( date +%s )
IAT="${NOW}"
EXP=$((${NOW} + 600))
HEADER_RAW='{"alg":"RS256"}'
HEADER=$( echo -n "${HEADER_RAW}" | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
PAYLOAD_RAW='{"iat":'"${IAT}"',"exp":'"${EXP}"',"iss":'"${GITHUB_APP_ID}"'}'
PAYLOAD=$( echo -n "${PAYLOAD_RAW}" | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
HEADER_PAYLOAD="${HEADER}"."${PAYLOAD}"

SIGNATURE=$( openssl dgst -sha256 -sign <(echo -n "${GITHUB_PRIVATE_KEY}") <(echo -n "${HEADER_PAYLOAD}") | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
JWT="${HEADER_PAYLOAD}"."${SIGNATURE}"

# Get the list of installations and iterate through them
installations_json=$(curl -sL \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $JWT" \
  https://api.github.com/app/installations)

for installation in $(echo $installations_json | jq -r '.[] | @base64'); do

    # Get the installation ID
    installation_id=$(echo $installation | base64 --decode | jq -r '.id')

    # Get the account type
    account_type=$(echo $installation | base64 --decode | jq -r '.account.type')

    # Get the account name
    account_name=$(echo $installation | base64 --decode | jq -r '.account.login')

    echo "Installation ID: $installation_id"
    echo "$account_type: $account_name"

    # Get the access token for the installation
    token_json=$(curl -sL \
        -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $JWT" \
        https://api.github.com/app/installations/$installation_id/access_tokens)

    # Get the token
    token=$(echo $token_json | jq -r '.token')

    echo "Access token: $token"

    # Get the list of repositories for the installation and iterate through them
    repos_json=$(curl -sL \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $token"\
        -H "X-GitHub-Api-Version: 2022-11-28" \
        https://api.github.com/orgs/$account_name/repos)

    for repo in $(echo $repos_json | jq -r '.[] | @base64'); do

        # Get the repo name
        repo_full_name=$(echo $repo | base64 --decode | jq -r '.full_name')

        # Get the repo visibility
        repo_visibility=$(echo $repo | base64 --decode | jq -r '.visibility')

        echo "Repository: $repo_full_name ( $repo_visibility )"

    done

done