# frozen_string_literal: true

require 'active_support/core_ext/integer/time'

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Ensures that a master key has been made available in either ENV["RAILS_MASTER_KEY"]
  # or in config/master.key. This key is used to decrypt credentials (and other encrypted files).
  # config.require_master_key = true

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    'Cache-Control' => "public, max-age=#{7.days.to_i}"
  }

  # Compress CSS using a preprocessor.
  # config.assets.css_compressor = :sass
  config.assets.css_compressor = nil
  config.assets.compile = false

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  config.asset_host = ENV['CLOUDFRONT_ENDPOINT']

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = "X-Sendfile" # for Apache
  # config.action_dispatch.x_sendfile_header = "X-Accel-Redirect" # for NGINX

  # Store uploaded files on the local file system (see config/storage.yml for options).
  # config.active_storage.service = :local
  config.active_storage.service = :supabase

  # Mount Action Cable outside main process or domain.
  # config.action_cable.mount_path = nil
  # config.action_cable.url = "wss://example.com/cable"
  config.action_cable.allowed_request_origins = ['barbermanagement.io', /.*\.barbermanagement\.io/]
  config.action_cable.disable_request_forgery_protection = false

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # --- Reverse proxy / Cloudflare Tunnel awareness --------------------------
  # A aplicação roda atrás de um Cloudflare Tunnel (e, em alguns deploys, de um
  # proxy adicional tipo Traefik/EasyPanel). Nessa cadeia a requisição chega com
  # cabeçalhos X-Forwarded-For / IP de proxy empilhados. O middleware
  # ActionDispatch::RemoteIp levanta IpSpoofAttackError quando esses cabeçalhos
  # divergem — e como esse middleware fica ACIMA do JsonErrorHandler, o erro vira
  # um 500. Qualquer leitura de request.remote_ip dispara o cálculo (ex.: o
  # SessionManagement grava o IP na sessão em endpoints autenticados como
  # /auth/me). Confiar na cadeia de proxy resolve os 500 e faz o remote_ip
  # resolver para o IP real do cliente.
  #
  # Reversível: defina TRUST_PROXY_HEADERS=false para voltar ao padrão do Rails.
  if ActiveModel::Type::Boolean.new.cast(ENV.fetch('TRUST_PROXY_HEADERS', 'true'))
    require 'ipaddr'

    config.action_dispatch.ip_spoofing_check = false

    # Faixas IP publicadas da Cloudflare (https://www.cloudflare.com/ips/).
    cloudflare_ranges = %w[
      173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22
      141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20
      197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13
      104.24.0.0/14 172.64.0.0/13 131.0.72.0/22
      2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32
      2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32
    ]
    extra_proxies = ENV.fetch('TRUSTED_PROXIES', '').split(',').map(&:strip).reject(&:empty?)

    # TRUSTED_PROXIES já cobre loopback (cloudflared conecta via localhost) e as
    # redes privadas usadas por proxies internos; só acrescentamos a Cloudflare.
    config.action_dispatch.trusted_proxies =
      ActionDispatch::RemoteIp::TRUSTED_PROXIES +
      (cloudflare_ranges + extra_proxies).map { |proxy| IPAddr.new(proxy) }
  end

  # Include generic and useful information about system operation, but avoid logging too much
  # information to avoid inadvertent exposure of personally identifiable information (PII).
  config.log_level = :warn

  # Prepend all log lines with the following tags.
  config.log_tags = [:request_id]

  # Use Redis cache store in production with namespace isolation
  redis_url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
  config.cache_store = :redis_cache_store, {
    url: redis_url,
    namespace: "orbi_production_cache",
    expires_in: 1.hour,
    reconnect_attempts: 3,
    error_handler: ->(method:, returning:, exception:) {
      Rails.logger.error "Cache error: #{method} failed with #{exception.class}: #{exception.message}"
    }
  }

  # Use a real queuing backend for Active Job (and separate queues per environment).
  # config.active_job.queue_adapter     = :resque
  # config.active_job.queue_name_prefix = "barber_management_production"

  config.action_mailer.perform_caching = false
  # config.action_mailer.default_url_options = { host: ENV.fetch('DEFAULT_HOST_NAME', 'app.barbermanagement.io') }
  # config.action_mailer.asset_host = "https://#{ENV.fetch('DEFAULT_HOST_NAME', 'app.barbermanagement.io')}"

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Use default logging formatter so that PID and timestamp are not suppressed.
  config.log_formatter = ::Logger::Formatter.new

  # Use a different logger for distributed setups.
  # require "syslog/logger"
  # config.logger = ActiveSupport::TaggedLogging.new(Syslog::Logger.new "app-name")

  if ENV['RAILS_LOG_TO_STDOUT'].present?
    logger           = ActiveSupport::Logger.new($stdout)
    logger.formatter = config.log_formatter
    config.logger    = ActiveSupport::TaggedLogging.new(logger)
  end

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false
  # config.hosts += [
  #   'barbermanagement.io',
  #   /.*\.barbermanagement\.io/,
  #
  #   # Stripe WH ip addresses
  #   '3.18.12.63',
  #   '3.130.192.231',
  #   '13.235.14.237',
  #   '13.235.122.149',
  #   '18.211.135.69',
  #   '35.154.171.200',
  #   '52.15.183.38',
  #   '54.88.130.119',
  #   '54.88.130.237',
  #   '54.187.174.169',
  #   '54.187.205.235',
  #   '54.187.216.72'
  # ]
end
