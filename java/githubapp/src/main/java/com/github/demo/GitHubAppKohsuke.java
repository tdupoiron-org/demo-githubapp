package com.github.demo;

import java.io.IOException;
import java.io.StringReader;
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
import org.kohsuke.github.GHApp;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHAppInstallationToken;
import org.kohsuke.github.GHOrganization;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;

import io.jsonwebtoken.Jwts;

public class GitHubAppKohsuke 
{
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
        GitHub github = new GitHubBuilder().withJwtToken(token).build();
        GHApp githubApp = github.getApp();

        // STEP 3 : For each installation, get the installation access token and list organization repositories
        for (GHAppInstallation installation : githubApp.listInstallations()) {

            long installationId = installation.getId();
            String organization = installation.getAccount().getLogin();

            System.out.println("Installation ID: " + installationId);
            System.out.println("Organization: " + organization);

            GHAppInstallationToken installationToken = installation.createToken().create();
            System.out.println("Access token: " + installationToken.getToken());

            GitHub githubInstallation = new GitHubBuilder().withJwtToken(installationToken.getToken()).build();
            GHOrganization org = githubInstallation.getOrganization(organization);
            for (GHRepository repo : org.listRepositories()) {
                System.out.println("Repository: " + repo.getName() + " (" + repo.getVisibility() + ")");
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

}