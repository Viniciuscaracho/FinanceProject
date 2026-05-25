# frozen_string_literal: true

require 'active_support/core_ext/integer/time'

Rails.application.configure do
  # Temporarily disable Bullet in dev to avoid interference on public endpoints
  # config.after_initialize do
  #   Bullet.enable        = true
  #   Bullet.alert         = false
  #   Bullet.bullet_logger = false
  #   Bullet.console       = true
  #   Bullet.rails_logger  = true
  #   Bullet.add_footer    = false
  # end

  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = true

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join('tmp/caching-dev.txt').exist?
    config.action_controller.perform_caching = true
    config.action_controller.enable_fragment_cache_logging = true
    config.public_file_server.headers = {
      'Cache-Control' => "public, max-age=#{2.days.to_i}"
    }
    
    # Configurar cache store com fallback para memory_store se Redis não estiver disponível
    begin
      redis_url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      test_redis = Redis.new(url: redis_url)
      test_redis.ping
      test_redis.quit
      
      config.cache_store = :redis_cache_store, {
        url: redis_url,
        namespace: "orbi_development_cache",
        expires_in: 1.hour,
        reconnect_attempts: 1,
        error_handler: ->(method:, returning:, exception:) {
          Rails.logger.warn "Cache error: #{method} failed with #{exception.class}: #{exception.message}"
        }
      }
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED, Redis::ConnectionError => e
      Rails.logger.warn "Redis não disponível para cache, usando memory_store: #{e.message}"
      config.cache_store = :memory_store, { size: 64.megabytes }
    end
  else
    config.action_controller.perform_caching = false
    # Usar memory_store como padrão quando caching está desabilitado
    config.cache_store = :memory_store, { size: 64.megabytes }
  end

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false
  # config.action_mailer.default_url_options = { host: ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000') }
  config.action_mailer.perform_caching = false
  # config.action_controller.default_url_options = { host: "#{ENV.fetch('DEFAULT_HOST_PROTOCOL', 'http')}://#{ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')}" }

  # SET SMTP
  unless ActiveRecord::Type::Boolean.new.cast(ENV.fetch('MAILGUN_ENABLED', 'false'))
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = { address: 'localhost', port: 1025 }
  end
  # config.action_mailer.asset_host = "#{ENV.fetch('DEFAULT_HOST_PROTOCOL',
  #                                                'http')}://#{ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')}"

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Suppress logger output for asset requests.
  config.assets.quiet = false

  # Config logger - escrever tanto no console quanto no arquivo
  log_file = Rails.root.join('log', 'development.log')
  logger = ActiveSupport::Logger.new($stdout)
  logger.extend(ActiveSupport::Logger.broadcast(ActiveSupport::Logger.new(log_file)))
  logger.formatter = config.log_formatter
  config.logger = logger

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  config.action_view.annotate_rendered_view_with_filenames = true

  # Uncomment if you wish to allow Action Cable access from any origin.
  config.action_cable.disable_request_forgery_protection = true
  config.hosts = nil

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :local

  # Asset configuration for development
  config.assets.debug = true
  config.assets.compile = true
  config.assets.digest = false
  config.assets.manifest = Rails.root.join('public', 'assets', 'manifest.json')
  config.assets.check_precompiled_asset = false
  config.assets.quiet = false

  # Set default host for url helpers
  # config.default_url_options[:host] = config.action_mailer.default_url_options[:host]
  # Rails.application.default_url_options[:host] = config.action_mailer.default_url_options[:host]
  # config.action_controller.default_url_options = { url: "#{ENV.fetch('DEFAULT_HOST_PROTOCOL', 'http')}://#{ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')}", port: 3000 }
end
