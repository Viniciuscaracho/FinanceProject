# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed = if Rails.env.development?
                ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
              elsif ENV['ALLOWED_ORIGINS'].present?
                ENV['ALLOWED_ORIGINS'].split(',').map(&:strip)
              else
                []
              end

    origins(*allowed)
    resource '*', headers: :any, methods: %i[get post patch put options delete head]
  end
end
