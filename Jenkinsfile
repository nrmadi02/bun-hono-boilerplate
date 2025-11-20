pipeline {
  agent any

  environment {
    PROJECT_DIR = '/root/project'
    IMAGE_BASE  = 'ghcr.io/nrmadi02/hono-bun'
    GITHUB_USER = 'nrmadi02'
  }

  stages {
    stage('Build & Push (GitHub Actions)') {
      steps {
        echo 'Build & push GitHub Actions'
      }
    }

    stage('Deploy staging') {
      when {
        branch 'staging'
      }
      steps {
        sshagent(credentials: ['ssh-ubuntu']) {
          withCredentials([
            string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
            string(credentialsId: 'server-host', variable: 'SERVER_HOST'),
          ])
          sh """
            ssh -o StrictHostKeyChecking=no root@${SERVER_HOST} '
              set -e
              cd ${PROJECT_DIR}
              echo "${GHCR_PAT}" | docker login ghcr.io -u ${GITHUB_USER} --password-stdin || true
              docker pull ${IMAGE_BASE}:staging
              docker compose -f docker-compose.staging.yml up -d
            '
          """
        }
      }
    }

    stage('Deploy production') {
      when {
        branch 'master'
      }
      steps {
        sshagent(credentials: ['ssh-ubuntu']) {
          withCredentials([
            string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
            string(credentialsId: 'server-host', variable: 'SERVER_HOST'),
          ])
          sh """
            ssh -o StrictHostKeyChecking=no root@${SERVER_HOST} '
              set -e
              cd ${PROJECT_DIR}
              echo "${GHCR_PAT}" | docker login ghcr.io -u ${GITHUB_USER} --password-stdin || true
              docker pull ${IMAGE_BASE}:production
              docker compose -f docker-compose.production.yml up -d
            '
          """
        }
      }
    }
  }

  options {
    disableConcurrentBuilds()
  }
}
