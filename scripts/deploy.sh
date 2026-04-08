#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/deploy.sh

Optional env:
  DEPLOY_PATH       Remote repo path (default: ~/graphref)
  DEPLOY_BRANCH     Branch to deploy (default: current branch)
  DEPLOY_REMOTE     Git remote (default: origin)
  DEPLOY_SERVICE_CMD Remote restart command (default: docker compose up -d --build)

Notes:
  - SSH target is hard-coded for personal use.
  - Stages all repo changes except .DS_Store files.
  - If there is nothing to commit, commit step is skipped.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

COMMIT_MESSAGE="deploy: auto"
DEPLOY_SSH_HOST="117.17.149.66"
DEPLOY_SSH_USER="smin"
DEPLOY_SSH_PORT="58652"
DEPLOY_SSH_KEY="${HOME}/.ssh/id_rsa"
DEPLOY_PATH="${DEPLOY_PATH:-~/graphref}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_SERVICE_CMD="${DEPLOY_SERVICE_CMD:-docker compose up -d --build}"
CURRENT_BRANCH="${DEPLOY_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
SSH_TARGET="${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}"
SSH_ARGS=(-p "${DEPLOY_SSH_PORT}")
SSH_ARGS+=(-i "${DEPLOY_SSH_KEY}")

echo "==> staging local changes"
git add -A -- . ':(exclude).DS_Store' ':(exclude)**/.DS_Store'

if ! git diff --cached --quiet; then
  echo "==> committing"
  git commit -m "${COMMIT_MESSAGE}"
else
  echo "==> nothing to commit"
fi

echo "==> pushing ${CURRENT_BRANCH} to ${DEPLOY_REMOTE}"
git push "${DEPLOY_REMOTE}" "${CURRENT_BRANCH}"

echo "==> deploying on ${SSH_TARGET}:${DEPLOY_PATH}"
ssh "${SSH_ARGS[@]}" "${SSH_TARGET}" \
  "set -euo pipefail; \
   cd ${DEPLOY_PATH}; \
   git fetch ${DEPLOY_REMOTE}; \
   git checkout ${CURRENT_BRANCH}; \
   git pull --rebase ${DEPLOY_REMOTE} ${CURRENT_BRANCH}; \
   ${DEPLOY_SERVICE_CMD}"

echo "==> deploy completed"
