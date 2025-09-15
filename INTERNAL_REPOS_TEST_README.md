# GitHub App Internal Repository Access Test

This project contains a test script designed to investigate if GitHub Apps can access internal repositories even when not explicitly configured to do so.

## Issue Summary

**Problem:** A GitHub App configured for specific repositories is showing internal repositories that weren't selected during app configuration. This poses potential security concerns as the app may have unintended access to internal/private repositories.

## Test Overview

The `list-org-repos.js` script performs comprehensive testing to determine if a GitHub App can access internal repositories by default, including:

### What the Test Does

1. **App Authentication**: Verifies GitHub App credentials and retrieves app information
2. **Installation Analysis**: Lists all app installations and their configurations
3. **Permission Auditing**: Examines installation permissions and repository selection settings
4. **Repository Access Testing**: Tests repository access through two methods:
   - Installation API (`/installation/repositories`)
   - Direct Organization API (`/orgs/{org}/repos`)
5. **Internal Repository Detection**: Specifically identifies and reports internal repositories
6. **Access Comparison**: Compares repository access between different API methods
7. **Security Analysis**: Reports potential security issues and unexpected access

### Key Features

- ✅ Comprehensive logging with emojis for easy reading
- 🔍 Detailed analysis of repository visibility levels
- ⚠️ Specific detection of internal repository access
- 📊 Comparison between configured permissions and actual access
- 🚨 Security issue identification and reporting
- 💡 Actionable recommendations for fixing issues

## Prerequisites

### Environment Variables

You need to set up the following environment variables:

```bash
export DEMO_GITHUBAPP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your GitHub App private key...
-----END RSA PRIVATE KEY-----"

export DEMO_GITHUBAPP_APPID="your-github-app-id"
```

### Dependencies

The script uses the following npm packages (already included in `package.json`):

- `@octokit/auth-app`: For GitHub App authentication
- `@octokit/rest`: For GitHub API interactions

## Running the Test

1. **Install dependencies:**
   ```bash
   cd javascript
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export DEMO_GITHUBAPP_PRIVATE_KEY="your-private-key"
   export DEMO_GITHUBAPP_APPID="your-app-id"
   ```

3. **Run the test:**
   ```bash
   node list-org-repos.js
   ```

## Understanding the Output

### Normal Output

The script provides detailed logging with the following sections:

- 📱 **App Information**: Basic details about your GitHub App
- 🏢 **Installations**: List of organizations/accounts where the app is installed
- 🔑 **Token Generation**: Creation of installation access tokens
- 🔐 **Permissions**: Detailed permissions for each installation
- 📋 **Repository Lists**: Repositories accessible through different API methods
- 🔍 **Access Comparison**: Differences between API access methods
- 📊 **Analysis**: Security analysis and findings
- 📋 **Final Report**: Summary and recommendations

### Critical Issues to Look For

#### 🚨 Internal Repository Access

If you see messages like:
```
⚠️  INTERNAL REPOSITORY ACCESSIBLE VIA DIRECT ORG ACCESS!
🚨 INTERNAL REPOSITORY DETECTED
```

This indicates that your GitHub App can access internal repositories, which may be the issue described in the GitHub ticket.

#### 🚨 Permission Mismatch

If you see:
```
🚨🚨🚨 CRITICAL ISSUE DETECTED 🚨🚨🚨
Found X internal repositories accessible via org API
but NOT explicitly granted via installation selection!
```

This confirms the exact issue reported: the app has access to repositories it shouldn't have.

## Common Scenarios

### Scenario 1: No Issues Found
```
✅ No internal repositories detected in this test
📝 Either no internal repos exist or permissions are properly configured
```

This means your GitHub App is properly configured and doesn't have unexpected access.

### Scenario 2: Issue Confirmed
```
🚨 ISSUE CONFIRMED: GitHub App can access internal repositories
📝 This matches the behavior described in the GitHub issue
```

This confirms the reported issue exists in your environment.

### Scenario 3: Configuration Issue
```
🔧 SPECIFIC ISSUE: App configured for 'selected' repos but accessing internal repos
📋 ACTION NEEDED: Check if internal repos were explicitly selected or if this is unintended access
```

This indicates a potential configuration problem that needs attention.

## Security Implications

### Why This Matters

- **Data Exposure**: Internal repositories may contain sensitive code or data
- **Compliance Issues**: Unintended access may violate security policies
- **Audit Trail**: Access logs may not accurately reflect intended permissions
- **Third-party Integrations**: External services may gain unexpected repository access

### Risk Assessment

- **High Risk**: GitHub App with broad permissions accessing internal repos unintentionally
- **Medium Risk**: GitHub App with limited scope but still accessing some internal repos
- **Low Risk**: No internal repository access detected

## Recommendations

### If Issues Are Found

1. **Immediate Actions:**
   - Review your GitHub App's repository selection
   - Check if internal repositories were explicitly selected
   - Audit all current app installations

2. **Configuration Changes:**
   - Use "Selected repositories" instead of "All repositories" when possible
   - Regularly review and update repository selections
   - Remove access to repositories that aren't needed

3. **Code Changes:**
   - Implement repository filtering in your application
   - Add visibility checks before processing repositories
   - Log repository access for audit purposes

4. **Ongoing Monitoring:**
   - Run this test regularly to detect new issues
   - Monitor GitHub App permissions and installations
   - Keep track of internal repository access patterns

### Example Filtering Code

If you need to filter out internal repositories in your application:

```javascript
// Filter out internal repositories
const publicRepos = repositories.filter(repo => repo.visibility === 'public');
const nonInternalRepos = repositories.filter(repo => repo.visibility !== 'internal');

// Or be explicit about what you want to access
const allowedRepos = repositories.filter(repo => {
    return repo.visibility === 'public' || 
           (repo.visibility === 'private' && isExplicitlyAllowed(repo.full_name));
});
```

## Troubleshooting

### Common Errors

1. **Authentication Failures:**
   - Check your `DEMO_GITHUBAPP_PRIVATE_KEY` format
   - Verify your `DEMO_GITHUBAPP_APPID` is correct
   - Ensure your app has necessary permissions

2. **No Installations Found:**
   - Install your GitHub App on at least one organization
   - Check that installations are active

3. **API Rate Limiting:**
   - The script includes reasonable delays
   - GitHub Apps have higher rate limits than personal tokens

### Getting Help

- Review the [GitHub Apps documentation](https://docs.github.com/en/developers/apps)
- Check the [GitHub REST API documentation](https://docs.github.com/en/rest)
- Contact GitHub Support if you discover unexpected behavior

## Contributing

If you find issues with this test or want to add features:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is provided as-is for testing and educational purposes. Use at your own risk and ensure you comply with your organization's security policies when testing with real GitHub Apps.
