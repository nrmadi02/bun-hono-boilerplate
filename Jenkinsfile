pipeline {
  agent any

  environment {
    PROJECT_DIR = '/root/project'
    IMAGE_BASE  = 'ghcr.io/nrmadi02/hono-bun'
    GITHUB_USER = 'nrmadi02'
    BRANCH_NAME_PARAM = "${params.BRANCH_NAME ?: env.BRANCH_NAME}"
    IMAGE_TAG_PARAM = "${params.IMAGE_TAG ?: (env.BRANCH_NAME == 'master' ? 'production' : 'staging')}"
  }

  parameters {
    string(name: 'BRANCH_NAME', defaultValue: '', description: 'Branch name from GitHub Actions')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Image tag from GitHub Actions')
  }

  stages {
    stage('Debug branch') {
      steps {
        sh '''
          echo "BRANCH_NAME=${BRANCH_NAME_PARAM}"
          echo "IMAGE_TAG=${IMAGE_TAG_PARAM}"
          echo "GIT_BRANCH=${GIT_BRANCH}"
        '''
      }
    }

    stage('Verify Image Available') {
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'ssh-ubuntu-key', keyFileVariable: 'SSH_KEYFILE', usernameVariable: 'SSH_USER'),
          string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
          string(credentialsId: 'server-host', variable: 'SERVER_HOST')
        ]) {
          sh '''
            set -e
            chmod 600 "$SSH_KEYFILE"
            printf "%s" "$GHCR_PAT" | ssh -o StrictHostKeyChecking=no -i "$SSH_KEYFILE" "$SSH_USER"@"$SERVER_HOST" "set -e; docker login ghcr.io -u ${GITHUB_USER} --password-stdin || true; docker pull ${IMAGE_BASE}:${IMAGE_TAG_PARAM}"
          '''
        }
      }
    }

    stage('Deploy staging') {
      when {
        expression {
          return (BRANCH_NAME_PARAM == 'staging') || 
                 (GIT_BRANCH?.contains('staging')) ||
                 (IMAGE_TAG_PARAM == 'staging')
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'ssh-ubuntu-key', keyFileVariable: 'SSH_KEYFILE', usernameVariable: 'SSH_USER'),
          string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
          string(credentialsId: 'server-host', variable: 'SERVER_HOST')
        ]) {
          sh '''
            set -e
            chmod 600 "$SSH_KEYFILE"

            # Pipe secret (GHCR_PAT) into remote docker login stdin.
            printf "%s" "$GHCR_PAT" | ssh -o StrictHostKeyChecking=no -i "$SSH_KEYFILE" "$SSH_USER"@"$SERVER_HOST" "set -e; cd ${PROJECT_DIR}; docker login ghcr.io -u ${GITHUB_USER} --password-stdin || true; docker pull ${IMAGE_BASE}:staging; docker compose -f docker-compose.staging.yml up -d"
          '''
        }
      }
    }

    stage('Deploy production') {
      when {
        expression {
          return (BRANCH_NAME_PARAM == 'master') || 
                 (env.GIT_BRANCH?.contains('master')) ||
                 (IMAGE_TAG_PARAM == 'production')
        }
      }
      steps {
        withCredentials([
          sshUserPrivateKey(credentialsId: 'ssh-ubuntu-key', keyFileVariable: 'SSH_KEYFILE', usernameVariable: 'SSH_USER'),
          string(credentialsId: 'ghcr-pat', variable: 'GHCR_PAT'),
          string(credentialsId: 'server-host', variable: 'SERVER_HOST')
        ]) {
          sh '''
            set -e
            chmod 600 "$SSH_KEYFILE"

            # Pipe secret into remote docker login stdin, expand safe vars locally
            printf "%s" "$GHCR_PAT" | ssh -o StrictHostKeyChecking=no -i "$SSH_KEYFILE" "$SSH_USER"@"$SERVER_HOST" "set -e; cd ${PROJECT_DIR}; docker login ghcr.io -u ${GITHUB_USER} --password-stdin || true; docker pull ${IMAGE_BASE}:production; docker compose -f docker-compose.production.yml up -d"
          '''
        }
      }
    }
  }

  options {
    disableConcurrentBuilds()
  }
}
