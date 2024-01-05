// STEP 1 : Generate a JWT
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

signing_key = process.env.DEMO_GITHUBAPP_PRIVATE_KEY;
appId = process.env.DEMO_GITHUBAPP_APPID;

const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: appId,
        privateKey: signing_key,
    },
});

async function listInstallations() {

    // STEP 2 : Use the JWT to get the app installations
    return octokit.apps.listInstallations().then((response) => {
        return response.data;
    });

}

async function createInstallationAccessToken(installationId) {
    
    // STEP 3 : For each installation, get the installation access token and list organization repositories
    return octokit.apps.createInstallationAccessToken({
        installation_id: installationId
    }).then((response) => {
        return response.data.token;
    });

}

async function listRepositories(organization, accessToken) {

    octokit_install = new Octokit({
        auth: accessToken
    });

    return octokit_install.repos.listForOrg({
        org: organization
    }).then((response) => {
        return response.data;
    });

}

async function getAppInfo(appSlug, accessToken) {

    octokit_install = new Octokit({
        auth: accessToken
    });

    octokit_install.apps.getBySlug({
        app_slug: appSlug
    }).then((response) => {
        console.log(response.data);
    });

}

async function main() {

    let installations = await listInstallations();
    
    for (var i = 0; i < installations.length; i++) {
        let installation = installations[i];
        console.log("Installation: " + installation.account.login);

        let accessToken = await createInstallationAccessToken(installation.id);
        console.log("Access Token: " + accessToken);
        
        let repositories = await listRepositories(installation.account.login, accessToken);
        for (var j = 0; j < repositories.length; j++) {
            repository = repositories[j];
            console.log("Repository: " + repository.full_name + " (" + repository.visibility + ")");
        }

        await getAppInfo("tdupoiron-githubapp-public", accessToken);
        await getAppInfo("tdupoiron-githubapp-private", accessToken);

    }

}

main(); 