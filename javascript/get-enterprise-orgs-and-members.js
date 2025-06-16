(async () => {
    const { createAppAuth } = await import("@octokit/auth-app");
    const { Octokit } = await import("@octokit/rest");   

    if (typeof process === 'undefined') {
        throw new Error("This script must be run in a Node.js environment.");
    }

    const signing_key = process.env.APP_ENT_KEY;
    const clientId = process.env.APP_ENT_CLIENTID;

    if (!signing_key || !clientId) {
        console.error("Please set the environment variables APP_ENT_KEY and APP_ENT_CLIENTID");
        process.exit(1);
    }

    // STEP 1: Generate a JWT for the app
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: clientId,
            privateKey: signing_key,
        },
    });

    async function getAuthenticatedAppInfo() {
        // Get the app information
        // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#get-the-authenticated-app
        return octokit.apps.getAuthenticated().then((response) => {
            return response.data;
        });
    }

    async function listInstallations() {
        // Use the JWT to get the app installations
        // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#list-installations-for-the-authenticated-app
        return octokit.apps.listInstallations().then((response) => {
            return response.data;
        });
    }

    async function createInstallationAccessToken(installationId) {
        // Create an installation access token
        // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
        return octokit.apps.createInstallationAccessToken({
            installation_id: installationId
        }).then((response) => {
            return response.data.token;
        });
    }

    async function listOrganizations(enterpriseSlug, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        let organizations = [];
        let page = 1;
        let perPage = 100;
        let hasNextPage = true;

        while (hasNextPage) {
            const response = await octokit_install.request('GET /enterprises/{enterprise}/apps/installable_organizations', {
                enterprise: enterpriseSlug,
                per_page: perPage,
                page: page
            });

            organizations = organizations.concat(response.data);
            hasNextPage = response.data.length === perPage;
            page++;
        }

        return organizations;
    }

    async function listOrgMembers(orgLogin, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        let members = [];
        let page = 1;
        let perPage = 100;
        let hasNextPage = true;

        try {
            while (hasNextPage) {
                const response = await octokit_install.request('GET /orgs/{org}/members', {
                    org: orgLogin,
                    per_page: perPage,
                    page: page
                });

                members = members.concat(response.data);
                hasNextPage = response.data.length === perPage;
                page++;
            }
        } catch (error) {
            if (error.status === 403) {
                console.log(`      ⚠️  Access denied to list members for ${orgLogin} (insufficient permissions)`);
                return [];
            } else if (error.status === 404) {
                console.log(`      ⚠️  Organization ${orgLogin} not found or not accessible`);
                return [];
            } else {
                console.error(`      ❌ Error listing members for ${orgLogin}:`, error.message);
                return [];
            }
        }

        return members;
    }



    async function getOrganizationDetails(orgLogin, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        try {
            const response = await octokit_install.request('GET /orgs/{org}', {
                org: orgLogin
            });
            
            return response.data;
        } catch (error) {
            console.error(`    ❌ Error getting organization details for ${orgLogin}:`, error.message);
            return {
                public_repos: 0,
                total_private_repos: 0,
                owned_private_repos: 0
            };
        }
    }

    async function getRepositoryCounts(orgLogin, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        let counts = {
            public: 0,
            internal: 0,
            private: 0,
            total: 0
        };

        try {
            // Get all repositories with their visibility
            let page = 1;
            let hasNextPage = true;
            
            while (hasNextPage) {
                const response = await octokit_install.request('GET /orgs/{org}/repos', {
                    org: orgLogin,
                    per_page: 100,
                    page: page,
                    type: 'all'
                });

                response.data.forEach(repo => {
                    counts.total++;
                    if (repo.visibility === 'public') {
                        counts.public++;
                    } else if (repo.visibility === 'internal') {
                        counts.internal++;
                    } else if (repo.visibility === 'private' || repo.private) {
                        counts.private++;
                    }
                });

                hasNextPage = response.data.length === 100;
                page++;
            }
        } catch (error) {
            console.error(`    ❌ Error getting repository counts for ${orgLogin}:`, error.message);
        }

        return counts;
    }

    async function checkAppInstallation(enterpriseSlug, orgLogin, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        try {
            // Check if the app is installed in the organization by trying to get the installation
            const response = await octokit_install.request('GET /orgs/{org}/installation', {
                org: orgLogin
            });
            
            // If we get a response, the app is installed
            return response.data && response.data.id;
        } catch (error) {
            if (error.status === 404) {
                return false; // App not installed
            }
            console.error(`    ❌ Error checking app installation for ${orgLogin}:`, error.message);
            return false;
        }
    }

    async function installAppInOrganization(enterpriseSlug, orgLogin, installationToken) {
        const octokit_install = new Octokit({
            auth: installationToken
        });

        try {
            // Install the app in the organization using the enterprise endpoint
            const response = await octokit_install.request('POST /enterprises/{enterprise}/apps/organizations/{org}/installations', {
                enterprise: enterpriseSlug,
                org: orgLogin,
                client_id: clientId, // Use the client ID string
                repository_selection: "all" // Install on all repositories
            });
            
            console.log(`      ✅ Successfully installed app in ${orgLogin}`);
            return response.data;
        } catch (error) {
            if (error.status === 422) {
                console.log(`      ⚠️  App may already be installed or pending approval in ${orgLogin}`);
            } else if (error.status === 403) {
                console.log(`      ❌ Insufficient permissions to install app in ${orgLogin}`);
            } else if (error.status === 404) {
                console.log(`      ❌ Organization ${orgLogin} not found or not accessible`);
            } else {
                console.error(`      ❌ Error installing app in ${orgLogin}:`, error.message);
            }
            return null;
        }
    }

    async function processEnterpriseInstallation(installation, installationStats) {
        console.log(`🏢 Enterprise: ${installation.account.login || installation.account.slug || 'Unknown'} (ID: ${installation.id})`);
        
        // Use login instead of slug for enterprise name
        const enterpriseSlug = installation.account.login || installation.account.slug;
        
        if (!enterpriseSlug) {
            console.error(`   ❌ Cannot determine enterprise identifier for installation ${installation.id}`);
            return;
        }

        // Create installation token
        let installationToken = await createInstallationAccessToken(installation.id);
        
        // List organizations in the enterprise
        let orgs = await listOrganizations(enterpriseSlug, installationToken);
        console.log(`   Found ${orgs.length} organization(s):\n`);
        
        installationStats.totalOrgs += orgs.length;
        
        for (let org of orgs) {
            console.log(`   📋 Organization: ${org.login}`);
            console.log(`      - Name: ${org.name || 'N/A'}`);
            console.log(`      - Description: ${org.description || 'N/A'}`);
            
            // Get actual repository counts by calling the repositories API
            let repoCounts = await getRepositoryCounts(org.login, installationToken);
            console.log(`      - Public Repos: ${repoCounts.public}`);
            console.log(`      - Internal Repos: ${repoCounts.internal}`);
            console.log(`      - Private Repos: ${repoCounts.private}`);
            console.log(`      - Total Repos: ${repoCounts.total}`);
            
            // Check if app is already installed
            let isAppInstalled = await checkAppInstallation(enterpriseSlug, org.login, installationToken);
            
            if (isAppInstalled) {
                console.log(`      ✅ App already installed in ${org.login}`);
                installationStats.alreadyInstalled++;
            } else {
                console.log(`      📦 Installing app in ${org.login}...`);
                let installResult = await installAppInOrganization(enterpriseSlug, org.login, installationToken);
                
                if (installResult) {
                    installationStats.newlyInstalled++;
                } else {
                    installationStats.failedInstallations++;
                }
            }
            
            // List members for this org
            let members = await listOrgMembers(org.login, installationToken);
            console.log(`      - Members: ${members.length}`);
            
            if (members.length > 0) {
                console.log(`      👥 Member list:`);
                members.forEach(member => {
                    console.log(`         - ${member.login} (ID: ${member.id}, Type: ${member.type})`);
                });
            }
            
            console.log(""); // Empty line for readability
        }
        
        console.log("─".repeat(80) + "\n");
    }

    async function processOrganizationInstallation(installation, installationStats) {
        console.log(`🏛️ Organization: ${installation.account.login} (ID: ${installation.id})`);
        
        installationStats.totalOrgs += 1;
        
        // Create installation token
        let installationToken = await createInstallationAccessToken(installation.id);
        
        // Get detailed organization information
        let orgDetails = await getOrganizationDetails(installation.account.login, installationToken);
        let repoCounts = await getRepositoryCounts(installation.account.login, installationToken);
        
        console.log(`   📋 Organization Details:`);
        console.log(`      - Name: ${orgDetails.name || 'N/A'}`);
        console.log(`      - Description: ${orgDetails.description || 'N/A'}`);
        console.log(`      - Public Repos: ${repoCounts.public}`);
        console.log(`      - Internal Repos: ${repoCounts.internal}`);
        console.log(`      - Private Repos: ${repoCounts.private}`);
        console.log(`      - Total Repos: ${repoCounts.total}`);
        
        // App is already installed (since we got this installation)
        console.log(`      ✅ App already installed in ${installation.account.login}`);
        installationStats.alreadyInstalled++;
        
        // List members for this org
        let members = await listOrgMembers(installation.account.login, installationToken);
        console.log(`      - Members: ${members.length}`);
        
        if (members.length > 0) {
            console.log(`      👥 Member list:`);
            members.forEach(member => {
                console.log(`         - ${member.login} (ID: ${member.id}, Type: ${member.type})`);
            });
        }
        
        console.log(""); // Empty line for readability
        console.log("─".repeat(80) + "\n");
    }

    async function main() {
        console.log("🚀 Starting Enterprise Organizations and Members Report with Auto-Installation\n");

        try {
            // Get app info
            let app = await getAuthenticatedAppInfo();
            console.log(`📱 App: ${app.name} (ID: ${app.id})\n`);

            // Get installations
            let installations = await listInstallations();
            console.log(`🏢 Found ${installations.length} installation(s)\n`);
            
            let installationStats = {
                totalOrgs: 0,
                alreadyInstalled: 0,
                newlyInstalled: 0,
                failedInstallations: 0
            };
            
            // Separate enterprise and organization installations
            let enterpriseInstallations = installations.filter(inst => inst.account.type === 'Enterprise');
            let orgInstallations = installations.filter(inst => inst.account.type === 'Organization');
            
            console.log(`   - Enterprise installations: ${enterpriseInstallations.length}`);
            console.log(`   - Organization installations: ${orgInstallations.length}\n`);
            
            // Process enterprise installations first
            if (enterpriseInstallations.length > 0) {
                console.log("🏢 Processing Enterprise Installations:\n");
                
                for (let installation of enterpriseInstallations) {
                    await processEnterpriseInstallation(installation, installationStats);
                }
            }
            
            // Then process individual organization installations
            if (orgInstallations.length > 0) {
                console.log("🏛️ Processing Individual Organization Installations:\n");
                
                for (let installation of orgInstallations) {
                    await processOrganizationInstallation(installation, installationStats);
                }
            }
            
            // Print installation summary
            console.log("📊 Installation Summary:");
            console.log(`   Total Organizations: ${installationStats.totalOrgs}`);
            console.log(`   Already Installed: ${installationStats.alreadyInstalled}`);
            console.log(`   Newly Installed: ${installationStats.newlyInstalled}`);
            console.log(`   Failed Installations: ${installationStats.failedInstallations}`);
            console.log("");
            
            console.log("✅ Report completed successfully!");
            
        } catch (error) {
            console.error("❌ Error during execution:", error.message);
            process.exit(1);
        }
    }

    main();

})();