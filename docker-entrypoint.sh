#!/bin/bash
set -e
# Remove PID
rm -f tmp/pids/server.pid tmp/pids/web.pid

if [ "${RAILS_DB_MIGRATE_ON_STARTUP}" = "true" ]
then
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
  DB_PORT=${DB_PORT:-5432}

  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  until timeout 2 bash -c ": < /dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; do
    echo "Database not ready, retrying in 2s..."
    sleep 2
  done
  echo "Database TCP ready, running setup..."
  bundle exec rails db:create 2>/dev/null || true
  bundle exec rails db:migrate || echo "⚠️  db:migrate failed — starting server anyway (check logs)"

  if [ -n "${SEED_ADMIN_EMAIL}" ]; then
    echo "Creating/promoting admin user: ${SEED_ADMIN_EMAIL}..."
    bundle exec rails runner "
      email = ENV['SEED_ADMIN_EMAIL']
      user  = User.find_by(email: email)
      if user
        user.update!(admin: true, confirmed_at: user.confirmed_at || Time.current)
        puts \"✅ Admin promoted: #{email}\"
      else
        pwd = ENV['SEED_ADMIN_PASSWORD'].presence || SecureRandom.hex(12)
        User.create!(
          email: email,
          first_name:             ENV.fetch('SEED_ADMIN_FIRST_NAME', 'Admin'),
          last_name:              ENV.fetch('SEED_ADMIN_LAST_NAME', ''),
          password:               pwd,
          password_confirmation:  pwd,
          admin:                  true,
          confirmed_at:           Time.current,
          accepted_terms_at:      Time.current,
          accepted_privacy_at:    Time.current
        )
        puts \"✅ Admin created: #{email} | password: #{pwd}\"
      end
    "
  fi
fi

exec "$@"
