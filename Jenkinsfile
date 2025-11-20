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
        expression {
          return (env.BRANCH_NAME == 'staging') || (env.GIT_BRANCH?.contains('staging'))
        }
      }
      steps {
        withCredentials([
          string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
          usernamePassword(credentialsId: 'ssh-ubuntu', usernameVariable: 'SSH_USER', passwordVariable: 'SSH_PASS'),
          string(credentialsId: 'server-host', variable: 'SERVER_HOST')
        ]) {
          sh """
            chmod 600 /dev/null || true
            sshpass -p "${SSH_PASS}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} '
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
        expression {
        return (env.BRANCH_NAME == 'master') || (env.GIT_BRANCH?.contains('master'))
      }
      }
      steps {
        withCredentials([
          string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
          usernamePassword(credentialsId: 'ssh-ubuntu', usernameVariable: 'SSH_USER', passwordVariable: 'SSH_PASS'),
          string(credentialsId: 'server-host', variable: 'SERVER_HOST')
        ]) {
          sh """
            chmod 600 /dev/null || true
            sshpass -p "${SSH_PASS}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} '
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
