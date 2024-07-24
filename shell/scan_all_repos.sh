#!/bin/bash

APP_KEY=$APP_SCANREPOS_PRIVATEKEY
APP_ID=$APP_SCANREPOS_APPID

NOW=$( date +%s )
IAT="${NOW}"
EXP=$((${NOW} + 600))
HEADER_RAW='{"alg":"RS256"}'
HEADER=$( echo -n "${HEADER_RAW}" | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
PAYLOAD_RAW='{"iat":'"${IAT}"',"exp":'"${EXP}"',"iss":'"${APP_ID}"'}'
PAYLOAD=$( echo -n "${PAYLOAD_RAW}" | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
HEADER_PAYLOAD="${HEADER}"."${PAYLOAD}"

SIGNATURE=$( openssl dgst -sha256 -sign <(echo -n "${APP_KEY}") <(echo -n "${HEADER_PAYLOAD}") | openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n' )
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

    # Initialize an empty JSON array
    repos_json="[]"
    
    # Function to fetch repositories and append to repos_json
    fetch_repos() {
      local page=1
      local per_page=100
      local temp_json
    
      while :; do
        if [ "$account_type" = "Organization" ]; then
          temp_json=$(curl -sL \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $token" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            "https://api.github.com/orgs/$account_name/repos?page=$page&per_page=$per_page")
        else
          temp_json=$(curl -sL \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $token" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            "https://api.github.com/users/$account_name/repos?page=$page&per_page=$per_page")
        fi
    
        # Break the loop if the response is empty (no more pages)
        if [ "$(echo "$temp_json" | jq '. | length')" -eq 0 ]; then
          break
        fi
    
        # Append the current page of repos to repos_json
        repos_json=$(echo "$repos_json" "$temp_json" | jq -s 'add')
    
        # Increment the page number
        page=$((page + 1))
      done
    }
    
    # Fetch all repositories
    fetch_repos

    # Count the number of repositories
    repo_count=$(echo $repos_json | jq length)
    echo "Number of Repositories: $repo_count"

    for repo in $(echo $repos_json | jq -r '.[] | @base64'); do

        # Get the repo name
        repo_full_name=$(echo $repo | base64 --decode | jq -r '.full_name')

        # Get the repo visibility
        repo_visibility=$(echo $repo | base64 --decode | jq -r '.visibility')

        echo "Repository: $repo_full_name ( $repo_visibility )"

    done

done