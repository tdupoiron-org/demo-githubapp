(async () => {
  const { createAppAuth } = await import("@octokit/auth-app");
  const { Octokit } = await import("@octokit/rest");

  if (typeof process === "undefined") {
    throw new Error("This script must be run in a Node.js environment.");
  }

  // Inputs: prefer CLI flags, fallback to env vars
  // CLI: --enterprise <slug> --org <login> --app-id <id>
  const args = new Map(
    process.argv
      .slice(2)
      .map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : null))
      .filter(Boolean)
  );

  const enterpriseSlug = args.get("enterprise") || process.env.ENTERPRISE_SLUG;
  const orgLogin = args.get("org") || process.env.ORG_LOGIN;
  const userToken = args.get("user-token") || process.env.ORG_ADMIN_TOKEN || process.env.GITHUB_TOKEN;
  const appId = Number(args.get("app-id") || process.env.APP_ID || process.env.APP_ENT_CLIENTID); // fallback to existing env naming
  const privateKey = process.env.APP_PRIVATE_KEY || process.env.APP_ENT_KEY;

  if (!enterpriseSlug || !orgLogin) {
    console.error(
      "Please provide enterprise and org. Use --enterprise <slug> --org <login> or set ENTERPRISE_SLUG and ORG_LOGIN."
    );
    process.exit(1);
  }

  if (!appId || !privateKey) {
    console.error(
      "Please provide APP_ID and APP_PRIVATE_KEY (or APP_ENT_CLIENTID and APP_ENT_KEY)."
    );
    process.exit(1);
  }

  // App-authenticated Octokit (JWT)
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
    request: { headers: { "X-GitHub-Api-Version": "2022-11-28" } },
  });

  async function getAppInstallations() {
    // List installations for the authenticated app
    // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#list-installations-for-the-authenticated-app
    const res = await appOctokit.apps.listInstallations();
    return res.data;
  }

  async function getEnterpriseInstallationId(installations, slug) {
    console.log(`\n[DEBUG] Looking for enterprise installation with slug/login: "${slug}"`);
    console.log(`[DEBUG] Total installations found: ${installations.length}`);
    
    installations.forEach((inst, idx) => {
      console.log(`[DEBUG] Installation ${idx + 1}:`, {
        id: inst.id,
        type: inst.account?.type,
        slug: inst.account?.slug,
        login: inst.account?.login,
      });
    });

    const match = installations.find(
      (i) => i.account && 
             (i.account.type === "Enterprise" || i.account.slug) && 
             (i.account.slug === slug || i.account.login === slug)
    );
    
    if (match) {
      console.log(`[DEBUG] ✓ Found matching enterprise installation: ${match.id}\n`);
    } else {
      console.log(`[DEBUG] ✗ No matching enterprise installation found\n`);
    }
    
    return match ? match.id : null;
  }

  async function createInstallationToken(installationId) {
    // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
    const res = await appOctokit.apps.createInstallationAccessToken({ installation_id: installationId });
    return res.data.token;
  }

  async function listAppsInstalledOnOrg(enterprise, org, token) {
    const octokit = new Octokit({
      auth: token,
      request: { headers: { "X-GitHub-Api-Version": "2022-11-28" } },
    });

    // https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/organization-installations?apiVersion=2022-11-28#list-github-apps-installed-on-an-enterprise-owned-organization
    const res = await octokit.request(
      "GET /enterprises/{enterprise}/apps/organizations/{org}/installations",
      { enterprise, org }
    );
    return res.data;
  }

  async function listAppsInstalledOnOrgWithUserToken(org) {
    if (!userToken) {
      throw new Error(
        "No user token provided. Set ORG_ADMIN_TOKEN or GITHUB_TOKEN, or pass --user-token <token> to use the org endpoint."
      );
    }

    const octokit = new Octokit({
      auth: userToken,
      request: { headers: { "X-GitHub-Api-Version": "2022-11-28" } },
    });

    // https://docs.github.com/en/rest/orgs/orgs?apiVersion=2022-11-28#list-app-installations-for-an-organization
    const res = await octokit.orgs.listAppInstallations({ org });
    // Normalizes to an array like enterprise endpoint shape-ish
    return (res.data.installations || res.data || []).map((inst) => ({
      id: inst.id,
      app_slug: inst.app_slug || inst.app?.slug,
      app_name: inst.app_name || inst.app?.name,
      client_id: inst.client_id || inst.app?.client_id,
      created_at: inst.created_at,
      updated_at: inst.updated_at,
    }));
  }

  try {
    console.log(`App ID: ${appId}`);
    console.log(`Enterprise: ${enterpriseSlug}`);
    console.log(`Organization: ${orgLogin}`);
    console.log(`[DEBUG] Private key provided: ${privateKey ? "YES (first 50 chars): " + privateKey.substring(0, 50) + "..." : "NO"}\n`);

    const installations = await getAppInstallations();
    const entInstallationId = await getEnterpriseInstallationId(installations, enterpriseSlug);

    let installedApps = [];
    if (entInstallationId) {
      const token = await createInstallationToken(entInstallationId);
      installedApps = await listAppsInstalledOnOrg(enterpriseSlug, orgLogin, token);
    } else {
      console.warn(
        `No enterprise installation found for "${enterpriseSlug}" — falling back to org endpoint with a user token (requires org owner with admin:read).`
      );
      installedApps = await listAppsInstalledOnOrgWithUserToken(orgLogin);
    }

    if (!Array.isArray(installedApps) || installedApps.length === 0) {
      console.log("No apps installed on this organization (or none visible with current permissions).");
      return;
    }

    console.log(`\n====================================`);
    console.log(`Found ${installedApps.length} app(s) installed for ${orgLogin}`);
    console.log(`====================================\n`);

    // Show full payload for first app as example
    if (installedApps.length > 0) {
      console.log(`[EXAMPLE] Full payload for first app:\n`);
      console.log(JSON.stringify(installedApps[0], null, 2));
      console.log(`\n[AVAILABLE FIELDS] Keys in payload:\n${Object.keys(installedApps[0]).join(", ")}\n`);
      console.log(`====================================\n`);
    }

    console.log(`Summary of all apps:\n`);
    for (const app of installedApps) {
      console.log(
        JSON.stringify(
          {
            id: app.id,
            app_slug: app.app_slug,
            app_name: app.app_name,
            client_id: app.client_id,
            created_at: app.created_at,
            updated_at: app.updated_at,
            target_type: app.target_type,
            permissions: app.permissions ? Object.keys(app.permissions).join(", ") : "none",
            events: app.events ? app.events.join(", ") : "none",
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    if (error && error.status === 403) {
      console.error(
        "Forbidden (403): The installation token likely lacks enterprise administration permission or the org is not enterprise-owned."
      );
    } else if (error && error.status === 404) {
      console.error(
        "Not Found (404): The organization may not be owned by the enterprise, or the endpoint is unavailable for your plan."
      );
    } else {
      console.error("Unexpected error:", error.message || error);
    }
    process.exit(3);
  }
})();
