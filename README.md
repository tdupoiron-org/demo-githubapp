# demo-githubapp


## Ruby
[Octokit Ruby](https://octokit.github.io/octokit.rb/Octokit/Client.html)

```bash
cd $CODESPACE_VSCODE_FOLDER
gem install jwt
gem install octokit
cd ruby/
ruby githubapp.rb
```

```bash
To use retry middleware with Faraday v2.0+, install `faraday-retry` gem
Installation ID: 32773233
Organization: tdupoiron-org
Access token: <token>
Repository: tdupoiron-org/sandbox (private)
Repository: tdupoiron-org/.github (public)
Repository: tdupoiron-org/sandbox-maven (public)
Repository: tdupoiron-org/hello-world-npm (public)
Repository: tdupoiron-org/artifacts-manager (public)
Repository: tdupoiron-org/sandbox-pages (private)
Repository: tdupoiron-org/tdupoiron-org.github.io (private)
Repository: tdupoiron-org/sandbox-pages-public (internal)
Repository: tdupoiron-org/sandbox-maven-2 (private)
Repository: tdupoiron-org/sandbox-reactjs (private)
Repository: tdupoiron-org/exercise-reference-a-codeql-query (private)
Repository: tdupoiron-org/exercise-configure-codeql-language-matrix (private)
Repository: tdupoiron-org/bootstrap (public)
Repository: tdupoiron-org/sandbox-maven2 (public)
Repository: tdupoiron-org/robert-repo (internal)
```

## Python
[GitHub Rest API](https://docs.github.com/en/rest)

```bash
cd $CODESPACE_VSCODE_FOLDER
pip3 install PyJWT
pip3 install cryptography
cd python/
python githubapp.py
```

```bash
Installation ID:  32773233
Organization:  tdupoiron-org
Access token:  <token>
Repository:  tdupoiron-org/sandbox ( private )
Repository:  tdupoiron-org/.github ( public )
Repository:  tdupoiron-org/sandbox-maven ( public )
Repository:  tdupoiron-org/hello-world-npm ( public )
Repository:  tdupoiron-org/artifacts-manager ( public )
Repository:  tdupoiron-org/sandbox-pages ( private )
Repository:  tdupoiron-org/tdupoiron-org.github.io ( private )
Repository:  tdupoiron-org/sandbox-pages-public ( internal )
Repository:  tdupoiron-org/sandbox-maven-2 ( private )
Repository:  tdupoiron-org/sandbox-reactjs ( private )
Repository:  tdupoiron-org/exercise-reference-a-codeql-query ( private )
Repository:  tdupoiron-org/exercise-configure-codeql-language-matrix ( private )
Repository:  tdupoiron-org/bootstrap ( public )
Repository:  tdupoiron-org/sandbox-maven2 ( public )
Repository:  tdupoiron-org/robert-repo ( internal )
```

## Javascript
[Octokit Javascript](https://octokit.github.io/rest.js/v19)

```bash
cd $CODESPACE_VSCODE_FOLDER/javascript
npm install
node githubapp.js
```

```bash
Installation ID: 32773233
Organization: tdupoiron-org
Access token: <token>
Repository: tdupoiron-org/sandbox (private)
Repository: tdupoiron-org/.github (public)
Repository: tdupoiron-org/sandbox-maven (public)
Repository: tdupoiron-org/hello-world-npm (public)
Repository: tdupoiron-org/artifacts-manager (public)
Repository: tdupoiron-org/sandbox-pages (private)
Repository: tdupoiron-org/tdupoiron-org.github.io (private)
Repository: tdupoiron-org/sandbox-pages-public (internal)
Repository: tdupoiron-org/sandbox-maven-2 (private)
Repository: tdupoiron-org/sandbox-reactjs (private)
Repository: tdupoiron-org/exercise-reference-a-codeql-query (private)
Repository: tdupoiron-org/exercise-configure-codeql-language-matrix (private)
Repository: tdupoiron-org/bootstrap (public)
Repository: tdupoiron-org/sandbox-maven2 (public)
Repository: tdupoiron-org/robert-repo (internal)
```

## Java
[GitHub Rest API](https://docs.github.com/en/rest)

```bash
cd $CODESPACE_VSCODE_FOLDER/java/githubapp
mvn package
mvn -Dexec.mainClass=com.github.demo.GitHubAppHttp exec:java

[INFO] Scanning for projects...
[INFO] 
[INFO] ---------------------< com.github.demo:githubapp >----------------------
[INFO] Building githubapp 1.0.0-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- exec-maven-plugin:3.1.0:java (default-cli) @ githubapp ---
Installation ID: 32435211
Organization: tdupoiron-org
Repository: sandbox (private)
Repository: .github (public)
Repository: sandbox-maven (public)
Repository: hello-world-npm (public)
Repository: artifacts-manager (public)
Repository: sandbox-pages (private)
Repository: tdupoiron-org.github.io (private)
Repository: sandbox-pages-public (internal)
Repository: sandbox-reactjs (private)
Repository: bootstrap (public)
Repository: demo-githubapp (public)
Repository: github-packages-demo (private)
Repository: upload-artifact (public)
Repository: demo-repository (private)
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.582 s
[INFO] Finished at: 2023-01-23T21:05:43Z
[INFO] ------------------------------------------------------------------------
```

Using 3rd party library [github-api](https://mvnrepository.com/artifact/org.kohsuke/github-api/1.313)

```bash
cd $CODESPACE_VSCODE_FOLDER/java/githubapp
mvn package
mvn -Dexec.mainClass=com.github.demo.GitHubAppKohsuke exec:java

[INFO] Scanning for projects...
[INFO] 
[INFO] ---------------------< com.github.demo:githubapp >----------------------
[INFO] Building githubapp 1.0.0-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- exec-maven-plugin:3.1.0:java (default-cli) @ githubapp ---
Installation ID: 32773233
Organization: tdupoiron-org
Access token: <token>
Repository: sandbox (private)
Repository: .github (public)
Repository: sandbox-maven (public)
Repository: hello-world-npm (public)
Repository: artifacts-manager (public)
Repository: sandbox-pages (private)
Repository: tdupoiron-org.github.io (private)
Repository: sandbox-pages-public (internal)
Repository: sandbox-maven-2 (private)
Repository: sandbox-reactjs (private)
Repository: exercise-reference-a-codeql-query (private)
Repository: exercise-configure-codeql-language-matrix (private)
Repository: bootstrap (public)
Repository: sandbox-maven2 (public)
Repository: robert-repo (internal)
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.964 s
[INFO] Finished at: 2023-01-05T09:37:06Z
[INFO] ------------------------------------------------------------------------
```
