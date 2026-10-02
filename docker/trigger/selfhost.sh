#!/usr/bin/env bash
# Self-host helper for Trigger.dev v4.7.2 (https://github.com/triggerdotdev/trigger.dev).
# NOT part of docker/compose.yml — Trigger.dev is heavy (~6GB+ RAM); local dev
# uses Trigger Cloud instead. See docker/trigger/README.md.
#
# Usage: docker/trigger/selfhost.sh up|down|logs
set -euo pipefail

TRIGGER_VERSION="v4.7.2"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="$DIR/.trigger-selfhost"
REPO_URL="https://github.com/triggerdotdev/trigger.dev.git"

usage() {
  echo "usage: $0 up|down|logs" >&2
  exit 1
}

[ $# -eq 1 ] || usage

compose() {
  docker compose \
    -f "$WORKDIR/hosting/docker/webapp/docker-compose.yml" \
    -f "$WORKDIR/hosting/docker/worker/docker-compose.yml" \
    "$@"
}

case "$1" in
  up)
    if [ ! -d "$WORKDIR/.git" ]; then
      echo "Cloning trigger.dev $TRIGGER_VERSION into $WORKDIR"
      git clone --depth 1 --branch "$TRIGGER_VERSION" "$REPO_URL" "$WORKDIR"
    fi
    if [ ! -f "$WORKDIR/hosting/docker/.env" ]; then
      echo "Generating secrets"
      (cd "$WORKDIR/hosting/docker" && ./generate-secrets.sh)
    fi
    compose up -d
    ;;
  down)
    compose down
    ;;
  logs)
    compose logs -f
    ;;
  *)
    usage
    ;;
esac
