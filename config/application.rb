# frozen_string_literal: true

require_relative 'boot'

require 'rails/all'

# Disable Flipper completely before any other initialization
# Override Flipper methods to prevent database connections
# module Flipper
#   def self.enabled?(*args)
#     false
#   end
#
#   def self.exist?(*args)
#     false
#   end
#
#   def self.add(*args)
#     # Do nothing
#   end
#
#   def self.enable(*args)
#     # Do nothing
#   end
#
#   def self.disable(*args)
#     # Do nothing
#   end
#
#   def self.preload_all
#     # Do nothing
#   end
#
#   def self.get_all
#     []
#   end
#
#   def self.[](*args)
#     # Return a dummy object that responds to enable/disable
#     DummyFeature.new
#   end
#
#   class DummyFeature
#     def enable(*args)
#       # Do nothing
#     end
#
#     def disable(*args)
#       # Do nothing
#     end
#
#     def enabled?(*args)
#       false
#     end
#   end
# end

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module BarberManagement
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones can be re-added if needed.
    # config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
    
    config.i18n.default_locale = :'pt-BR'
    config.i18n.available_locales = [:'pt-BR', :en]

    # Adicionar middleware ao autoload
    config.autoload_paths << Rails.root.join("app/middleware")
    config.autoload_paths << Rails.root.join("lib")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = false

    # Default host for application
    config.action_mailer.default_url_options = { host: ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000') }
    config.action_mailer.asset_host = "#{ENV.fetch('DEFAULT_HOST_PROTOCOL', 'http')}://#{ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')}"

    # Encryption key derivation salt
    config.active_record.encryption.primary_key = Rails.application.credentials.encryption_primary_key
    config.active_record.encryption.deterministic_key = Rails.application.credentials.encryption_deterministic_key
    config.active_record.encryption.key_derivation_salt = Rails.application.credentials.encryption_key_derivation_salt

    # Disable Flipper middleware completely
    # config.middleware.delete(Flipper::Middleware::Memoizer) if defined?(Flipper::Middleware::Memoizer)
    
    # Adicionar middleware para garantir que erros da API sempre retornem JSON
    require_relative '../app/middleware/json_error_handler'
    config.middleware.use JsonErrorHandler
  end
end
