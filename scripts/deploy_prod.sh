#!/usr/bin/env bash
set -euo pipefail

cd /opt/statisfaction

git pull
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
