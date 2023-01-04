### STEP 1 : Generate a JWT

require 'openssl'
require 'jwt'  # https://rubygems.org/gems/jwt

# Private key contents
private_pem = ENV["DEMO_GITHUBAPP_PRIVATE_KEY"]
private_key = OpenSSL::PKey::RSA.new(private_pem)

# Generate the JWT
appid = ENV["DEMO_GITHUBAPP_APPID"]

payload = {
  # issued at time, 60 seconds in the past to allow for clock drift
  iat: Time.now.to_i - 60,
  # JWT expiration time (10 minute maximum)
  exp: Time.now.to_i + (10 * 60),
  # GitHub App's identifier
  iss: appid
}

jwt = JWT.encode(payload, private_key, "RS256")

### STEP 2 : Use the JWT to get the app installations

require 'octokit'

client = Octokit::Client.new(bearer_token: jwt)
app = client.app

installations = client.find_app_installations

### STEP 3 : For each installation, get the installation access token and list organization repositories

# For Each installation
installations.each do |installation|

  installation_id = installation.id
  organization = installation.account.login

  # Get the installation access token
  token = client.create_app_installation_access_token(installation.id)[:token]

  # Use the installation access token to authenticate as an installation
  installation_client = Octokit::Client.new(bearer_token: token)

  # Get the repositories that the app has been installed in
  repositories = installation_client.organization_repositories(organization)

  repositories.each do |repo|
    puts repo.visibility + " - " + repo.full_name
  end

end