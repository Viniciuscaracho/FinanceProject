#!/bin/bash
set -e
# Remove PID
rm -f tmp/pids/server.pid

# Wait for database and run migrations
if [ "${RAILS_DB_MIGRATE_ON_STARTUP}" = "true" ]
then
  echo "Waiting for database connection..."
  until bundle exec ruby -e "require 'pg'; PG.connect(ENV.fetch('DATABASE_URL')); puts 'DB ready'" 2>/dev/null; do
    echo "Database not ready, retrying in 2s..."
    sleep 2
  done
  echo "Creating database if needed..."
  bundle exec rails db:create 2>/dev/null || true
  echo "Running migrations..."
  bundle exec rails db:migrate
fi

# Call CMD
exec "$@"
