(async () => {
// STEP 1 : Generate a JWT
const { createAppAuth } = await import("@octokit/auth-app");
const { Octokit } = await import("@octokit/rest");   

signing_key = process.env.DEMO_GITHUBAPP_PRIVATE_KEY;
appId = process.env.DEMO_GITHUBAPP_APPID;

if (!signing_key || !appId) {
    console.error("Please set the environment variables DEMO_GITHUBAPP_PRIVATE_KEY and DEMO_GITHUBAPP_APPID");
    process.exit(1);
}

const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: appId,
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
        console.log(response.data);
        return response.data.token;
    });

}

async function listRepositories(organization, installationToken) {

    // https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-organization-repositories
    // https://api.github.com/orgs/{org}/repos
    octokit_install = new Octokit({
        auth: installationToken
    });

    return octokit_install.repos.listForOrg({
        org: organization
    }).then((response) => {
        return response.data;
    });

}

async function getInstalledAppInfo(appSlug, installationToken) {

    // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#get-an-app
    // https://api.github.com/apps/{app_slug}
    octokit_install = new Octokit({
        auth: installationToken
    });

    octokit_install.apps.getBySlug({
        app_slug: appSlug
    }).then((response) => {
        console.log(response.data);
    });

}

async function main() {

    let app = await getAuthenticatedAppInfo();
    console.log(app);

    let installations = await listInstallations();
    
    for (var i = 0; i < installations.length; i++) {
        let installation = installations[i];
        console.log("Installation: " + installation.account.login);

        let installationToken = await createInstallationAccessToken(installation.id);
        console.log("Installation Token: " + installationToken);
        
        let repositories = await listRepositories(installation.account.login, installationToken);
        for (var j = 0; j < repositories.length; j++) {
            let repository = repositories[j];
            console.log("Repository: " + repository.full_name + " (" + repository.visibility + ")");
        }

        await getInstalledAppInfo(app.name, installationToken);

    }

}

main(); 

})().catch((error) => {
    console.error(error);
    process.exit(1);
}
);