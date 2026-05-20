CORS_ALLOWED_PATTERN = /\Ahttps?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|.*\.easypanel\.host|.*\.useorbi\.app|.*\.orbinutri\.com\.br|orbinutri\.com\.br)\z/

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins do |source, _env|
      # Always check dynamic env var list first (comma-separated exact origins)
      explicit = ENV.fetch('ALLOWED_ORIGINS', '').split(',').map(&:strip).reject(&:empty?)
      next true if explicit.include?(source)

      # Fall back to pattern-based allowlist
      source.match?(CORS_ALLOWED_PATTERN)
    end

    resource '/api/*',
             headers: :any,
             methods: %i[get post put patch delete options head],
             credentials: true,
             expose: ['Authorization']

    resource '/cable',
             headers: :any,
             methods: %i[get post],
             credentials: true
  end
end
