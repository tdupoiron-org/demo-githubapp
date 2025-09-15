/**
 * GitHub App Internal Repository Access Test
 * 
 * This script tests whether a GitHub App can access internal repositories
 * even when not explicitly granted permissions to them.
 * 
 * Issue Reference: https://github.com/githubcustomers/capgemini/issues/154
 * 
 * The issue describes a scenario where a GitHub App configured for specific repositories
 * is showing internal repositories that weren't selected during app configuration.
 */

(async () => {
    const { createAppAuth } = await import("@octokit/auth-app");
    const { Octokit } = await import("@octokit/rest");

    // Environment variables
    const signing_key = process.env.DEMO_GITHUBAPP_PRIVATE_KEY;
    const appId = process.env.DEMO_GITHUBAPP_APPID;

    if (!signing_key || !appId) {
        console.error("❌ Please set the environment variables:");
        console.error("   DEMO_GITHUBAPP_PRIVATE_KEY");
        console.error("   DEMO_GITHUBAPP_APPID");
        process.exit(1);
    }

    console.log("🔍 GitHub App Internal Repository Access Test");
    console.log("=" .repeat(60));

    // Initialize Octokit with App authentication
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: appId,
            privateKey: signing_key,
        },
    });

    /**
     * Get authenticated app information
     */
    async function getAppInfo() {
        console.log("\n📱 Getting app information...");
        try {
            const response = await octokit.apps.getAuthenticated();
            const app = response.data;
            console.log(`   App Name: ${app.name}`);
            console.log(`   App ID: ${app.id}`);
            console.log(`   Owner: ${app.owner.login}`);
            console.log(`   Created: ${app.created_at}`);
            return app;
        } catch (error) {
            console.error("❌ Failed to get app information:", error.message);
            throw error;
        }
    }

    /**
     * List all installations for this app
     */
    async function listInstallations() {
        console.log("\n🏢 Listing app installations...");
        try {
            const response = await octokit.apps.listInstallations();
            const installations = response.data;
            console.log(`   Found ${installations.length} installation(s)`);
            
            installations.forEach((installation, index) => {
                console.log(`   ${index + 1}. ${installation.account.login} (${installation.account.type})`);
                console.log(`      Installation ID: ${installation.id}`);
                console.log(`      Repository Selection: ${installation.repository_selection}`);
                console.log(`      Created: ${installation.created_at}`);
            });
            
            return installations;
        } catch (error) {
            console.error("❌ Failed to list installations:", error.message);
            throw error;
        }
    }

    /**
     * Get installation access token
     */
    async function createInstallationToken(installationId) {
        console.log(`\n🔑 Creating installation access token for installation ${installationId}...`);
        try {
            const response = await octokit.apps.createInstallationAccessToken({
                installation_id: installationId
            });
            console.log("   ✅ Installation token created successfully");
            console.log(`   📝 Token: ${response.data.token}`);
            return response.data.token;
        } catch (error) {
            console.error("❌ Failed to create installation token:", error.message);
            throw error;
        }
    }

    /**
     * Get installation repositories (what the app thinks it has access to)
     */
    async function getInstallationRepositories(installationId, token) {
        console.log(`\n📋 Getting repositories accessible through installation ${installationId}...`);
        const installOctokit = new Octokit({ auth: token });
        
        try {
            const response = await installOctokit.apps.listReposAccessibleToInstallation();
            const repositories = response.data.repositories;
            
            console.log(`   Found ${repositories.length} accessible repositories through installation:`);
            repositories.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.full_name}`);
                console.log(`      Visibility: ${repo.visibility}`);
                console.log(`      Private: ${repo.private}`);
                if (repo.visibility === 'internal') {
                    console.log(`      ⚠️  INTERNAL REPOSITORY DETECTED`);
                }
            });
            
            return repositories;
        } catch (error) {
            console.error("❌ Failed to get installation repositories:", error.message);
            throw error;
        }
    }

    /**
     * Get installation permissions and configuration
     */
    async function getInstallationPermissions(installationId) {
        console.log(`\n🔐 Checking installation permissions for ${installationId}...`);
        
        try {
            const response = await octokit.apps.getInstallation({
                installation_id: installationId
            });
            
            const installation = response.data;
            console.log(`   Repository Selection: ${installation.repository_selection}`);
            console.log(`   Account: ${installation.account.login} (${installation.account.type})`);
            console.log(`   Permissions:`);
            
            if (installation.permissions) {
                Object.entries(installation.permissions).forEach(([permission, level]) => {
                    console.log(`      ${permission}: ${level}`);
                });
            } else {
                console.log("      No specific permissions found");
            }
            
            return installation;
        } catch (error) {
            console.error("❌ Failed to get installation details:", error.message);
            throw error;
        }
    }

    /**
     * Test direct organization repository access
     */
    async function testDirectOrgAccess(orgName, token) {
        console.log(`\n🏗️  Testing direct organization repository access for ${orgName}...`);
        const installOctokit = new Octokit({ auth: token });
        
        try {
            const response = await installOctokit.repos.listForOrg({
                org: orgName,
                type: 'all', // Get all repository types
                per_page: 100
            });
            
            const repositories = response.data;
            console.log(`   Found ${repositories.length} repositories via direct org access:`);
            
            const reposByVisibility = {
                public: [],
                private: [],
                internal: []
            };
            
            repositories.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.full_name}`);
                console.log(`      Visibility: ${repo.visibility}`);
                console.log(`      Private: ${repo.private}`);
                console.log(`      Archived: ${repo.archived}`);
                console.log(`      Fork: ${repo.fork}`);
                
                reposByVisibility[repo.visibility].push(repo);
                
                if (repo.visibility === 'internal') {
                    console.log(`      🚨 INTERNAL REPOSITORY ACCESSIBLE VIA DIRECT ORG ACCESS!`);
                }
            });
            
            return { repositories, reposByVisibility };
        } catch (error) {
            console.error("❌ Failed to access organization repositories:", error.message);
            console.error("   This might be expected if the app doesn't have org-level permissions");
            return { repositories: [], reposByVisibility: { public: [], private: [], internal: [] } };
        }
    }

    /**
     * Compare installation repos vs direct org access
     */
    function compareAccess(installationRepos, orgAccessRepos, installation) {
        console.log("\n🔍 COMPARING ACCESS METHODS");
        console.log("-".repeat(40));
        
        const installationRepoNames = new Set(installationRepos.map(r => r.full_name));
        const orgAccessRepoNames = new Set(orgAccessRepos.map(r => r.full_name));
        
        // Repos accessible via installation but not direct org access
        const installationOnly = installationRepos.filter(r => !orgAccessRepoNames.has(r.full_name));
        
        // Repos accessible via direct org access but not installation
        const orgAccessOnly = orgAccessRepos.filter(r => !installationRepoNames.has(r.full_name));
        
        console.log(`   Installation API repos: ${installationRepos.length}`);
        console.log(`   Direct Org Access repos: ${orgAccessRepos.length}`);
        console.log(`   Only via Installation: ${installationOnly.length}`);
        console.log(`   Only via Org Access: ${orgAccessOnly.length}`);
        
        if (installation.repository_selection === 'selected' && orgAccessOnly.length > 0) {
            console.log("\n⚠️  POTENTIAL ISSUE: Direct org access shows more repos than installation access!");
            console.log("   This could indicate the GitHub App issue described in the ticket.");
            
            const internalOrgOnly = orgAccessOnly.filter(r => r.visibility === 'internal');
            if (internalOrgOnly.length > 0) {
                console.log(`\n🚨 CRITICAL: ${internalOrgOnly.length} internal repo(s) accessible via org API but not in installation:`);
                internalOrgOnly.forEach(repo => {
                    console.log(`      - ${repo.full_name}`);
                });
            }
        }
        
        return { installationOnly, orgAccessOnly };
    }

    /**
     * Analyze and report findings
     */
    function analyzeFindings(installationRepos, orgAccessRepos, installation, accessComparison) {
        console.log("\n📊 ANALYSIS OF INTERNAL REPOSITORY ACCESS");
        console.log("=" .repeat(60));
        
        const installationInternalRepos = installationRepos.filter(repo => repo.visibility === 'internal');
        const orgAccessInternalRepos = orgAccessRepos.internal || [];
        
        console.log(`\n🔍 Internal Repositories Found:`);
        console.log(`   Via Installation API: ${installationInternalRepos.length}`);
        console.log(`   Via Direct Org Access: ${orgAccessInternalRepos.length}`);
        
        console.log(`\n📋 Installation Configuration:`);
        console.log(`   Repository Selection: ${installation.repository_selection}`);
        console.log(`   Account Type: ${installation.account.type}`);
        
        if (installationInternalRepos.length > 0) {
            console.log("\n⚠️  INTERNAL REPOSITORIES ACCESSIBLE VIA INSTALLATION:");
            installationInternalRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.full_name}`);
                console.log(`      Created: ${repo.created_at}`);
                console.log(`      Updated: ${repo.updated_at}`);
            });
            console.log("\n🚨 This confirms the issue reported: GitHub App can access internal repos!");
        }
        
        if (orgAccessInternalRepos.length > 0) {
            console.log("\n⚠️  INTERNAL REPOSITORIES ACCESSIBLE VIA ORG API:");
            orgAccessInternalRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.full_name}`);
                console.log(`      Created: ${repo.created_at}`);
                console.log(`      Updated: ${repo.updated_at}`);
            });
        }
        
        // Check for discrepancies that match the reported issue
        if (installation.repository_selection === 'selected' && accessComparison.orgAccessOnly.length > 0) {
            const internalOrgOnlyRepos = accessComparison.orgAccessOnly.filter(r => r.visibility === 'internal');
            if (internalOrgOnlyRepos.length > 0) {
                console.log("\n🚨🚨🚨 CRITICAL ISSUE DETECTED 🚨🚨🚨");
                console.log(`Found ${internalOrgOnlyRepos.length} internal repositories accessible via org API`);
                console.log("but NOT explicitly granted via installation selection!");
                console.log("This matches EXACTLY the issue described in the GitHub ticket.");
            }
        }
        
        // Summary
        console.log("\n📋 SUMMARY:");
        if (installationInternalRepos.length > 0 || orgAccessInternalRepos.length > 0) {
            console.log("   🚨 ISSUE CONFIRMED: GitHub App can access internal repositories");
            console.log("   📝 This matches the behavior described in the GitHub issue");
            console.log("   💡 Recommendation: Review app permissions and repository selection carefully");
            
            if (installation.repository_selection === 'selected') {
                console.log("   🔧 SPECIFIC ISSUE: App configured for 'selected' repos but accessing internal repos");
                console.log("   📋 ACTION NEEDED: Check if internal repos were explicitly selected or if this is unintended access");
            }
        } else {
            console.log("   ✅ No internal repositories detected in this test");
            console.log("   📝 Either no internal repos exist or permissions are properly configured");
        }
    }

    /**
     * Main test execution
     */
    async function runTest() {
        try {
            // Step 1: Get app information
            const app = await getAppInfo();
            
            // Step 2: List installations
            const installations = await listInstallations();
            
            if (installations.length === 0) {
                console.log("⚠️  No installations found. Please install the app on an organization first.");
                return;
            }
            
            // Step 3: Test each installation
            for (const installation of installations) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🧪 TESTING INSTALLATION: ${installation.account.login}`);
                console.log(`${'='.repeat(60)}`);
                
                // Get installation token
                const token = await createInstallationToken(installation.id);

                
                
                // Get installation permissions and configuration
                const installationDetails = await getInstallationPermissions(installation.id);
                
                // Test installation repository access
                const installationRepos = await getInstallationRepositories(installation.id, token);
                
                // Test direct organization access
                const { repositories: orgRepos, reposByVisibility } = await testDirectOrgAccess(
                    installation.account.login, 
                    token
                );
                
                // Compare access methods
                const { installationOnly, orgAccessOnly } = compareAccess(
                    installationRepos, 
                    orgRepos, 
                    installationDetails
                );
                
                // Analyze findings
                analyzeFindings(installationRepos, reposByVisibility, installationDetails, { installationOnly, orgAccessOnly });
            }
            
            console.log(`\n${'='.repeat(60)}`);
            console.log("🏁 TEST COMPLETED");
            console.log(`${'='.repeat(60)}`);
            
            // Generate final report
            generateFinalReport(installations);
            
        } catch (error) {
            console.error("\n❌ Test failed:", error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }

    /**
     * Generate a comprehensive final report
     */
    function generateFinalReport(installations) {
        console.log("\n📋 FINAL REPORT");
        console.log("=" .repeat(60));
        
        console.log("\n🎯 PURPOSE:");
        console.log("   This test was designed to investigate GitHub issue #154 which reports that");
        console.log("   GitHub Apps can access internal repositories even when not explicitly configured.");
        
        console.log("\n🔍 WHAT WE TESTED:");
        console.log("   1. GitHub App authentication and installation access");
        console.log("   2. Repository access through installation API vs direct org API");
        console.log("   3. Specific focus on internal repository visibility");
        console.log("   4. Comparison between configured permissions and actual access");
        
        console.log(`\n📊 INSTALLATIONS TESTED: ${installations.length}`);
        installations.forEach((installation, index) => {
            console.log(`   ${index + 1}. ${installation.account.login} (${installation.repository_selection} repositories)`);
        });
        
        console.log("\n🚨 KEY FINDINGS:");
        console.log("   - If internal repositories were detected, this confirms the reported issue");
        console.log("   - Pay special attention to 'selected' installations accessing internal repos");
        console.log("   - Direct org API access may show more repositories than installation API");
        
        console.log("\n💡 RECOMMENDATIONS:");
        console.log("   1. Carefully review GitHub App permissions and repository selection");
        console.log("   2. Consider using 'selected repositories' over 'all repositories' when possible");
        console.log("   3. Regularly audit which repositories your GitHub App can access");
        console.log("   4. Be aware that internal repositories may be accessible by default");
        console.log("   5. Implement additional filtering in your application if needed");
        
        console.log("\n📖 NEXT STEPS:");
        console.log("   1. If internal repos were found, review your GitHub App configuration");
        console.log("   2. Consider reaching out to GitHub Support if unexpected access is discovered");
        console.log("   3. Implement proper repository filtering in your integration");
        console.log("   4. Document your findings and share with your security team");
    }

    // Run the test
    await runTest();

})().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
});
