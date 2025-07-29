#!/usr/bin/env bash
# exit on error
set -o errexit

apt-get update -qq && apt-get install -y -qq --no-install-recommends chromium-browser
export PUPPETEER_EXECUTABLE_PATH="$(which chromium-browser)"

bundle config --local without "production test omit"
bundle install --jobs 4 --retry 5
yarn install
yarn build
yarn build:css
bundle exec rails db:migrate 2>/dev/null || (bundle exec rails db:create && bundle exec rails db:migrate)