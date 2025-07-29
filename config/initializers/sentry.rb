# frozen_string_literal: true

traces_sample_rate_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('SENTRY_TRACES_ENABLED', true))
default_traces_sample_rate = ActiveModel::Type::Float.new.cast(ENV.fetch('SENTRY_TRACES_RATE', 0.1))

Sentry.init do |config|
  config.dsn = Rails.application.credentials.dig(:sentry, :dsn)
  config.excluded_exceptions += %w[ActionController::RoutingError ActiveRecord::RecordNotFound]
  config.breadcrumbs_logger = %i[sentry_logger active_support_logger http_logger]
  config.environment = Rails.env
  config.enabled_environments = %w[production]
  config.logger = Sentry::Logger.new($stdout) if Rails.env.production?
  config.debug = Rails.env.development?

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  # config.traces_sample_rate = traces_sample_rate_enabled ? traces_sample_rate : 0.0
  config.traces_sampler = lambda do |sampling_context|
    next sampling_context[:parent_sampled] unless sampling_context[:parent_sampled].nil?
    return 0.0 unless traces_sample_rate_enabled

    # transaction_context is the transaction object in hash form
    # keep in mind that sampling happens right after the transaction is initialized
    # for example, at the beginning of the request
    transaction_context = sampling_context[:transaction_context]

    # transaction_context helps you sample transactions with more sophistication
    # for example, you can provide different sample rates based on the operation or name
    op = transaction_context[:op]

    case op
    when /http/
      rack_env = sampling_context[:env]
      path_info = rack_env['PATH_INFO']
      transaction_method = rack_env['REQUEST_METHOD']
      transaction_name = "#{transaction_method} #{path_info}"

      case transaction_name
      when /health_check/, /sidekiq/, /admin/, /rails/, /assets/, /favicon/, /robots/, /cable/
        0.0
      else
        0.03
      end
    when /sidekiq/
      default_traces_sample_rate
    when /websocket/
      0.01
    else
      0.0
    end
  end
end
