// STEP 1 : Generate a JWT

const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

signing_key = process.env.DEMO_GITHUBAPP_PRIVATE_KEY;
appId = process.env.DEMO_GITHUBAPP_APPID;

const octokit_app = new Octokit({
    authStrategy: createAppAuth,
    auth: {
        appId: appId,
        privateKey: signing_key,
    },
});

// STEP 2 : Use the JWT to get the app installations

octokit_app.apps.listInstallations().then((response) => {
    
    installations = response.data;

    // STEP 3 : For each installation, get the installation access token and list organization repositories

    for (var i = 0; i < installations.length; i++) {
        installation = installations[i];

        installationId = installation.id;
        organization = installation.account.login;

        console.log("Installation ID: " + installationId);
        console.log("Organization: " + organization);

        octokit_app.apps.createInstallationAccessToken({
            installation_id: installationId
        }).then((response) => {
            accessToken = response.data.token;

            console.log("Access token: " + accessToken);

            octokit_install = new Octokit({
                auth: accessToken
            });

            octokit_install.repos.listForOrg({
                org: organization
            }).then((response) => {
                repositories = response.data;
                for (var j = 0; j < repositories.length; j++) {
                    repository = repositories[j];
                    console.log("Repository: " + repository.full_name + " (" + repository.visibility + ")");
                }
            });
        });

    }

});