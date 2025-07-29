#!/bin/bash

checkSidekiq() {
  # shellcheck disable=SC2046
  if [ $(bundle exec sidekiqmon processes | grep -Po '\d' | awk '{s+=$1} END {print s}') -gt 0 ]; then
    exit 0
  else
    exit 1
  fi
}

checkSidekiq