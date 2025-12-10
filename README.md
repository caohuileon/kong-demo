# kong-demo
Demo for Cypress CI test on Kong API

# Design Framework
Demo designed running with Github Actions CI workflow. Split as two parts:
## _Local Test Setups_
### _Step-1: Setup local Kong Environment_
* Install Docker and Docker compose in my Ubuntu VM
* Config proxy for Docker
```
# cat /etc/systemd/system/docker.service.d/proxy.conf
[Service]
Environment="HTTP_PROXY=http://192.168.3.49:11223"
Environment="HTTPS_PROXY=http://192.168.3.49:11223"
Environment="NO_PROXY=localhost,127.0.0.1,192.168.0.0/16"
```
* Download [Dockerfile](https://drive.google.com/file/d/1ZqYLsFhcBAseFofEV8YCcOt4vZnItiBi/view?usp=sharing) to your VM work directory
* Start Kong docker services `docker compose up -d`
* Then you can open `http://localhost:8002` and you will see Kong manager UI
* UI has a default Service or you can add a new service and route from navigation bar and check enabled, now the service and the route is added through UI

### _Step-2: Install dependencies on your VM_
* Install node.js, npm
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```
* Install other dependencies
```
sudo apt install -y libgtk-3-0t64 libgbm1 libnss3 libxss1 libasound2t64 libxtst6 xvfb
```

### _Step-3: Install Cypress and run testcase_
* Install Cypress and init
```
cd cypress-demo
npm init -y
npm install cypress --save-dev
```
* Write local testcase under ___cypress-demo/cypress/e2e___
* Using bellow command to test
```
Single: npx cypress run --spec cypress/e2e/kong-create-service.cy.js
Folder: npx cypress run --spec cypress/e2e/
```
* Brief report display like this once done \
![Report Sample](https://github.com/caohuileon/kong-demo/blob/main/docs/report_sample.png)

## _Github Actions CI Setups_
After local test working ready, now we setup Github Actions to integrate it into CI automation workflow
### _Step-1: Create Project in your Github repo_
* Create project [kong-demo](https://github.com/caohuileon/kong-demo) on personal Github
* Copy testcase into directory: `https://github.com/caohuileon/kong-demo/tree/main/cypress-demo/cypress/e2e`
* Create [cypress.config.js](https://github.com/caohuileon/kong-demo/blob/main/cypress-demo/cypress.config.js) file for Cypress

### _Step-2: Create Github Actions Workflow file_
* Create Github Actions workflow file: [kong-cypress-test.yml](https://github.com/caohuileon/kong-demo/blob/main/.github/workflows/kong-cypress-test.yml)
* Edit workflow file as bellow build steps: 
```
Setup docker and compose -> Start Kong -> Setup Node.js -> Install Cypress -> Run Cypress test -> Teardown Cleanup
```
* Edit workflow file on ___push___ trigger, branch use default `main`
```
on:
  push:
    branches: [ "main" ]
```

### _Step-3: Verify Github Actions CI workflow_
After push event happened, you will able to see actions workflow event running as bellow: \
![Report Sample](https://github.com/caohuileon/kong-demo/blob/main/docs/ci_report.png)

# Summary
Through this test demo, I have gained a basic understanding of Kong Gateway. The project setup follows a two-step approach:
### Set up a local Kong runtime environment
First, I familiarized myself with Kong's basic configurations through its UI. Then, I wrote local Cypress test cases and ensured they could run successfully in the local environment.
### Implement CI automated testing with GitHub Actions
Building on the local setup, I created a GitHub Actions automated workflow to enable the test cases to run successfully on GitHub Runners, thereby realizing an end-to-end CI automated testing process.
### Test Case Design
Given my limited initial exposure to Kong Gateway, the test cases designed are relatively simple—focusing on creating/deleting services and basic gateway functionality. These cases only meet the requirements specified in the assessment document. More in-depth test case design and development will require further familiarity with Kong's product capabilities.
### Trade-offs and Considerations
My professional experience is primarily rooted in the Jenkins + Python automation framework ecosystem. However, this Kong testing project relies on a tech stack of Cypress (JavaScript/TypeScript) + GitHub Actions. Due to my limited understanding of JavaScript and GitHub Actions workflows, the project's scope and depth remain basic. Mastery of this new ecosystem will require a gradual learning process.
