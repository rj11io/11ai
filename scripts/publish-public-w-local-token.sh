#!/usr/bin/env sh

set -eu

ENV_FILE="${PWD}/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo ".env file not found at project root"
  exit 1
fi

TOKEN_LINE="$(grep '^NPM_TOKEN=' "$ENV_FILE" | tail -n 1 || true)"

if [ -z "$TOKEN_LINE" ]; then
  echo "NPM_TOKEN not found in .env"
  exit 1
fi

NPM_TOKEN="${TOKEN_LINE#NPM_TOKEN=}"

case "$NPM_TOKEN" in
  \"*\") NPM_TOKEN="${NPM_TOKEN#\"}"; NPM_TOKEN="${NPM_TOKEN%\"}" ;;
  \'*\') NPM_TOKEN="${NPM_TOKEN#\'}"; NPM_TOKEN="${NPM_TOKEN%\'}" ;;
esac

if [ -z "$NPM_TOKEN" ]; then
  echo "NPM_TOKEN is empty"
  exit 1
fi

npm publish --access public "--//registry.npmjs.org/:_authToken=${NPM_TOKEN}"
