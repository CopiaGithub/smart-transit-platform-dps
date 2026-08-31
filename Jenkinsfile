// Transit Display Platform — BE + FE IIS deploy pipeline (modeled on dms-master Jenkinsfile).
//
// Jenkins job setup required:
//   - Agent: Windows node with .NET SDK (net10.0), Node via nvm (see NODE_VERSION), IIS WebAdministration module
//   - Credentials: create a GitHub PAT credential and set GIT_CREDENTIALS_ID below (do not commit tokens)
//   - Job type: Pipeline from SCM (or paste this Jenkinsfile); branch typically `develop`
//   - Confirm APP_POOL_NAME matches the IIS app pool bound to the DEV site
//
// Deploy layout on target (ENVIRONMENT=DEV):
//   C:\inetpub\Sites\Transit Display Platform Master\DEV
//     Backend\              <- published .NET API (DLLs only; web.config/appsettings left intact)
//     Frontend\             <- Angular dist (web.config left intact)
//     deployment_backups\   <- timestamped backend backups
//     web.config            <- site root; never overwritten by this pipeline

pipeline {
    agent any

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['DEV'], description: 'IIS environment folder under the site root')
        booleanParam(name: 'DEPLOY_FRONTEND', defaultValue: true, description: 'Build & deploy the Angular frontend')
        booleanParam(name: 'DEPLOY_BACKEND',  defaultValue: true, description: 'Build & deploy the .NET backend')
    }

    environment {
        // Angular 21 needs Node ^20.19 || ^22.12 || ^24 — ensure this version exists on the agent (nvm)
        NODE_VERSION = '22.12.0'
        REPO_URL     = 'https://github.com/CopiaGithub/smart-transit-platform-dps.git'
        BRANCH       = 'develop'
        // Named Jenkins credential (Secret text or Username/Password with PAT). Replace with your credential ID.
        GIT_CREDENTIALS_ID = 'c9cfb0ee-1b54-4239-a00b-4e21c9556dc7'

        IIS_SITE_ROOT = 'C:\\inetpub\\Sites\\Transit Display Platform Master'

        // ---- Frontend ----
        FRONTEND_DIST = "${WORKSPACE}\\apps\\frontend\\dist\\frontend\\browser"

        // ---- Backend ----
        BACKEND_PROJECT      = "${WORKSPACE}\\apps\\backend\\transit-display-platform-api.csproj"
        BACKEND_PUBLISH_PATH = "${WORKSPACE}\\publish\\api"
        // Must match the IIS app pool for this site/environment
        APP_POOL_NAME        = 'tdpdev_api'

        TIMESTAMP = "${new Date().format('yyyyMMddHHmmss')}"
    }

    stages {
        stage('Resolve deploy paths') {
            steps {
                script {
                    def envName = params.ENVIRONMENT
                    env.WEB_DEPLOY_PATH = "${env.IIS_SITE_ROOT}\\${envName}\\Frontend"
                    env.API_DEPLOY_PATH = "${env.IIS_SITE_ROOT}\\${envName}\\Backend"
                    env.BACKUP_PATH     = "${env.IIS_SITE_ROOT}\\${envName}\\deployment_backups\\backend"
                    echo "Frontend deploy: ${env.WEB_DEPLOY_PATH}"
                    echo "Backend deploy:  ${env.API_DEPLOY_PATH}"
                    echo "Backend backup:  ${env.BACKUP_PATH}"
                }
            }
        }

        stage('Git Checkout') {
            steps {
                git branch: "${BRANCH}", credentialsId: "${GIT_CREDENTIALS_ID}", url: "${REPO_URL}"
            }
        }

        // ---------- BACKEND BUILD & DEPLOY ----------
        stage('Backend: Restore & Build') {
            when { expression { params.DEPLOY_BACKEND } }
            steps {
                bat 'dotnet restore "%BACKEND_PROJECT%"'
                bat 'dotnet build "%BACKEND_PROJECT%" --configuration Release'
            }
        }

        stage('Stop IIS App Pool') {
            when { expression { params.DEPLOY_BACKEND } }
            steps {
                powershell '''
                    Import-Module WebAdministration
                    if ((Get-WebAppPoolState -Name "$env:APP_POOL_NAME").Value -eq "Started") {
                        Stop-WebAppPool -Name "$env:APP_POOL_NAME"
                        Start-Sleep -Seconds 5
                    }
                '''
            }
        }

        stage('Backup Existing Backend') {
            when { expression { params.DEPLOY_BACKEND } }
            steps {
                bat 'mkdir "%BACKUP_PATH%\\%TIMESTAMP%"'
                bat 'xcopy /e /i /y "%API_DEPLOY_PATH%\\*" "%BACKUP_PATH%\\%TIMESTAMP%\\"'
            }
        }

        stage('Backend: Publish & Deploy') {
            when { expression { params.DEPLOY_BACKEND } }
            steps {
                bat 'if exist "%WORKSPACE%\\apps\\backend\\publish" rmdir /s /q "%WORKSPACE%\\apps\\backend\\publish"'
                bat 'if exist "%BACKEND_PUBLISH_PATH%" rmdir /s /q "%BACKEND_PUBLISH_PATH%"'
                bat 'dotnet publish "%BACKEND_PROJECT%" --configuration Release --framework net10.0 --runtime win-x64 --self-contained false --output "%BACKEND_PUBLISH_PATH%"'

                echo 'Copy only DLLs to server (web.config and appsettings.json are left untouched)'
                bat 'robocopy "%BACKEND_PUBLISH_PATH%" "%API_DEPLOY_PATH%" *.dll /S /XO & exit /b 0'
            }
        }

        stage('Start IIS App Pool') {
            when { expression { params.DEPLOY_BACKEND } }
            steps {
                powershell '''
                    Import-Module WebAdministration
                    if ((Get-WebAppPoolState -Name "$env:APP_POOL_NAME").Value -ne "Started") {
                        Start-WebAppPool -Name "$env:APP_POOL_NAME"
                    }
                '''
            }
        }

        // ---------- FRONTEND BUILD & DEPLOY ----------
        stage('Use Node version') {
            when { expression { params.DEPLOY_FRONTEND } }
            steps {
                bat 'nvm use %NODE_VERSION%'
            }
        }

        stage('Frontend: Install & Build') {
            when { expression { params.DEPLOY_FRONTEND } }
            steps {
                dir('apps\\frontend') {
                    bat 'npm ci'
                    // DEV environment uses Angular development configuration (matches dms-master)
                    bat 'npx ng build --configuration=development'
                }
            }
        }

        stage('Frontend: Deploy') {
            when { expression { params.DEPLOY_FRONTEND } }
            steps {
                echo 'Sync build to destination (web.config is left untouched)'
                bat '''
                if not exist "%WEB_DEPLOY_PATH%" mkdir "%WEB_DEPLOY_PATH%"
                robocopy "%FRONTEND_DIST%" "%WEB_DEPLOY_PATH%" /E /MIR /XF web.config /NFL /NDL /NJH /NJS /nc /ns /np & exit /b 0
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully.'
        }
        unsuccessful {
            echo "Deployment failed - check logs. Last backend backup: ${env.BACKUP_PATH}\\${TIMESTAMP}"
            powershell '''
                Import-Module WebAdministration
                if ((Get-WebAppPoolState -Name "$env:APP_POOL_NAME").Value -ne "Started") {
                    Start-WebAppPool -Name "$env:APP_POOL_NAME"
                    Write-Host "App pool $env:APP_POOL_NAME was stopped; restarted after deployment failure."
                }
            '''
        }
    }
}
