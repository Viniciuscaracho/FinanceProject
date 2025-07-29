#!/usr/bin/env bash
# exit on error
set -o errexit

bundle config --local without "production test omit"
bundle install --jobs 4 --retry 5