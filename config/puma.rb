# frozen_string_literal: true

# Puma can serve each request in a thread from an internal thread pool.
# The `threads` method setting takes two numbers: a minimum and maximum.
# Any libraries that use thread pools should be configured to match
# the maximum value specified for Puma. Default is set to 5 threads for minimum
# and maximum; this matches the default thread size of Active Record.
#
env               = ENV.fetch('RAILS_ENV', 'development')
max_threads_count = ENV.fetch('RAILS_MAX_THREADS', 5)
min_threads_count = ENV.fetch('RAILS_MIN_THREADS', max_threads_count)
threads min_threads_count, max_threads_count

# Specifies the `worker_timeout` threshold that Puma will use to wait before
# terminating a worker in development environments.
#
# worker_timeout 3600

# Specifies the `port` that Puma will listen on to receive requests; default is 3000.
# Bind to all interfaces (0.0.0.0) to allow access from network devices
# This is necessary for mobile devices and emulators to access the API
bind ENV.fetch('BIND', 'tcp://0.0.0.0:3000')

# Specifies the `environment` that Puma will run in.
#
environment env

# Specifies the `pidfile` that Puma will use.
if ENV.key?('API_ONLY')
  pidfile ENV.fetch('PIDFILE', 'tmp/pids/api.pid')
else
  pidfile ENV.fetch('PIDFILE', 'tmp/pids/web.pid')
end

# Specifies the number of `workers` to boot in clustered mode.
# Workers are forked web server processes. If using threads and workers together
# the concurrency of the application would be max `threads` * `workers`.
# Workers do not work on JRuby or Windows (both of which do not support
# processes).
#
workers ENV['WEB_CONCURRENCY'].to_i if ENV.key?('WEB_CONCURRENCY')

# Use the `preload_app!` method when specifying a `workers` number.
# This directive tells Puma to first boot the application and load code
# before forking the application. This takes advantage of Copy On Write
# process behavior so workers use less memory.
#
preload_app! if ENV.key?('WEB_CONCURRENCY')

# Allow puma to be restarted by `bin/rails restart` command.
plugin :tmp_restart
