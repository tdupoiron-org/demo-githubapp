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

// STEP 1 : Generate a JWT for the app
const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: clientId,
        privateKey: signing_key,
    },
});

async function getAuthenticatedAppInfo() {
    
    // STEP 1 : Get the app information
    // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#get-the-authenticated-app
    // https://api.github.com/app
    return octokit.apps.getAuthenticated().then((response) => {
        return response.data;
    });

}


async function listInstallations() {

    // STEP 2 : Use the JWT to get the app installations
    // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#list-installations-for-the-authenticated-app
    // https://api.github.com/app/installations/{installation_id}/access_tokens
    return octokit.apps.listInstallations().then((response) => {
        return response.data;
    });

}

async function createInstallationAccessToken(installationId) {
    
    // STEP 3 : For each installation, get the installation access token and list organization repositories
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

async function getInstalledApps(enterpriseSlug, orgLogin, installationToken) {
    
        // https://docs.github.com/en/rest/enterprises/enterprise-administration/apps-in-enterprises#list-apps-in-an-enterprise
        // https://api.github.com/enterprises/{enterprise}/apps
        const octokit_install = new Octokit({
            auth: installationToken
        });
    
        return octokit_install.request('GET /enterprises/{enterprise}/apps/organizations/{org}/installations', {
            enterprise: enterpriseSlug,
            org: orgLogin
        }).then((response) => {
            return response.data;
        });
    
    }

async function main() {

    let app = await getAuthenticatedAppInfo();
    console.log(app);

    let installations = await listInstallations();
    
    for (var i = 0; i < installations.length; i++) {
        let installation = installations[i];
        console.log("Enterprise installation: " + installation.account.slug);

        let installationToken = await createInstallationAccessToken(installation.id);
        console.log("Installation Token: " + installationToken);
        
        // List organizations
        let orgs = await listOrganizations(installation.account.slug, installationToken);
        for (var j = 0; j < orgs.length; j++) {
            let org = orgs[j];
            console.log("  Organization: " + org.login);
            // List installed apps
            let installedApps = await getInstalledApps(installation.account.slug, org.login, installationToken);
            for (var k = 0; k < installedApps.length; k++) {
                let installedApp = installedApps[k];
                console.log("    Installed App Info: " + JSON.stringify({
                    id: installedApp.id,
                    app_slug: installedApp.app_slug,
                    client_id: installedApp.client_id
                }));
            }
            // log new line
            console.log("");
        }

    }

}

main(); 

})();