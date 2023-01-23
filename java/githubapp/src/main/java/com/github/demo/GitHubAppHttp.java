package com.github.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Security;
import java.security.spec.InvalidKeySpecException;
import java.util.Date;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;

import com.github.objects.AccessToken;
import com.github.objects.Installation;
import com.github.objects.Repository;
import com.google.gson.Gson;

import io.jsonwebtoken.Jwts;

public class GitHubAppHttp 
{

    public final static String GITHUB_API_LIST_INSTALLATIONS_URL = "https://api.github.com/app/installations";
    public final static String GITHUB_API_CREATE_INSTALLATION_TOKEN_URL = "https://api.github.com/app/installations/%s/access_tokens";
    public final static String GITHUB_API_GET_ORGANIZATION_REPOS_URL = "https://api.github.com/orgs/%s/repos";

    /**
     * @param args
     * @throws NoSuchAlgorithmException
     * @throws InvalidKeySpecException
     * @throws IOException
     */
    public static void main( String[] args ) throws NoSuchAlgorithmException, InvalidKeySpecException, IOException
    {
        
        // STEP 1 : Generate a JWT
        String signingKey = System.getenv("DEMO_GITHUBAPP_PRIVATE_KEY");
        String appId = System.getenv("DEMO_GITHUBAPP_APPID");

        PrivateKey privateKey = getPrivateKey(signingKey);

        String token = Jwts.builder()
            .setIssuer(appId)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 600000))
            .signWith(privateKey)
            .compact();

        // STEP 2 : Use the JWT to get the app installations
        String installationsJson = callGitHubAPI("GET", GITHUB_API_LIST_INSTALLATIONS_URL, token);

        Gson gson = new Gson();
        Installation[] installations = gson.fromJson(installationsJson.toString(), Installation[].class); 

        // STEP 3 : For each installation, get the installation access token and list organization repositories
        for (Installation installation : installations) {

            long installationId = installation.getId();
            String organization = installation.getAccount().getLogin();

            System.out.println("Installation ID: " + installationId);
            System.out.println("Organization: " + organization);

            String installationTokenJson = callGitHubAPI("POST", String.format(GITHUB_API_CREATE_INSTALLATION_TOKEN_URL, installationId), token);
            String installationToken = gson.fromJson(installationTokenJson.toString(), AccessToken.class).getToken();

            String organizationReposJson = callGitHubAPI("GET", String.format(GITHUB_API_GET_ORGANIZATION_REPOS_URL, organization), installationToken);
            Repository[] repositories = gson.fromJson(organizationReposJson.toString(), Repository[].class); 

            for (Repository repository : repositories) {
                System.out.println("Repository: " + repository.getName() + " (" + repository.getVisibility() + ")");
            }

        }

    }

    public static PrivateKey getPrivateKey(String key) throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        Security.addProvider(new BouncyCastleProvider());
        PEMParser pemParser = new PEMParser(new StringReader(key));

        JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");
        Object object = pemParser.readObject();
        KeyPair kp = converter.getKeyPair((PEMKeyPair) object);
        PrivateKey privateKey = kp.getPrivate();
        return privateKey;
    }

    public static String callGitHubAPI(String method, String url, String token) throws IOException {

        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod(method);
        con.setRequestProperty("Authorization", "Bearer " + token);

        BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
        String inputLine;
        StringBuffer response = new StringBuffer();

        while ((inputLine = in.readLine()) != null) {
            response.append(inputLine);
        }
        in.close();

        // print result
        return response.toString();

    }

        

}