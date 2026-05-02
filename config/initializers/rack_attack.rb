# frozen_string_literal: true

module Rack
  # Configuração do Rack Attack
  class Attack
    # Temporariamente desabilitado para depuração de endpoints públicos
    default_enabled = Rails.env.production? || Rails.env.staging?
    self.enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('RACK_ATTACK_ENABLED', default_enabled))

    # Limita o acesso a 40 requests a cada 3 segundos
    throttle('req/ip', limit: 90, period: 3.seconds) do |req|
      req.ip unless req.path.start_with?('/assets', '/rails/active_storage', '/cable', '/webhooks')
    end

    # Limita em 40 requests por 3 segundos aos endpoints de api/*
    throttle('req/api', limit: 40, period: 3.seconds) do |req|
      req.ip if req.path.start_with?('/api')
    end

    # Limita tentativas de login/register por IP — 10 por minuto
    throttle('auth/ip', limit: 10, period: 1.minute) do |req|
      req.ip if req.post? && req.path.match?(%r{/api/v1/auth/(login|register)})
    end

    # Limita tentativas de login por email — 5 por minuto
    throttle('auth/email', limit: 5, period: 1.minute) do |req|
      if req.post? && req.path.match?(%r{/api/v1/auth/(login|register)})
        body = req.body.read
        req.body.rewind
        JSON.parse(body)['email'].to_s.downcase.strip rescue nil
      end
    end

    # Limita em 10 requests por minuto aos endpoints de login e cadastro de usuários para o mesmo e-mail
    throttle('req/users/email', limit: 10, period: 1.minute) do |req|
      if req.post? && req.path.include?('/users') && req.params.dig('user', 'email').present?
        Rails.logger.debug "Rack::Attack.throttle('req/users/email') do |req|: #{req.params.dig('user', 'email')}"
        req.params.dig('user', 'email').to_s.downcase.strip
      end
    end

    # Evitar ataques de força bruta com emails dummy
    # throttle('req/users/dummy', limit: 5, period: 1.minute) do |req|
    #   next unless req.post? && req.path.include?('/users') && req.params.dig('user', 'email').present?
    #
    #   email = req.params.dig('user', 'email').to_s.downcase.strip
    #   next unless email.split('@').last.in?(EmailVerificationHelper::DUMMY_EMAIL_DOMAINS)
    #
    #   Rails.logger.info "Rack::Attack.throttle('req/users/dummy') do |req|: #{email}"
    #   email
    # end

    # Limita em 10 requests por minuto aos endpoints de login e cadastro de usuários
    throttle('req/users/ip', limit: 30, period: 1.minute) do |req|
      if req.path.include?('/users') && req.post?
        Rails.logger.debug "Rack::Attack.throttle('req/users/ip', limit: 30, period: 1.minute) do |req|: #{req.ip}"
        req.ip
      end
    end

    # Block suspicious requests for '/etc/password' or wordpress specific paths.
    # After 3 blocked requests in 10 minutes, block all requests from that IP for 5 minutes.
    blocklist('block/pen_testers') do |req|
      # `filter` returns truthy value if request fails, or if it's from a previously banned IP
      # so the request is blocked
      Fail2Ban.filter("pen_testers/#{req.ip}", maxretry: 3, findtime: 10.minutes, bantime: 5.minutes) do
        # The count for the IP is incremented if the return value is truthy
        CGI.unescape(req.query_string) =~ %r{/etc/passwd} ||
          req.path.include?('/etc/passwd') ||
          req.path.include?('wp-admin') ||
          req.path.include?('wp-login')
      end
    end

    # Lockout IP addresses that are hammering your login page.
    # After 30 requests in 1 minute, block all requests from that IP for 5 minutes.
    blocklist('block/scrapers') do |req|
      # `filter` returns false value if request is to your login page (but still
      # increments the count) so request below the limit are not blocked until
      # they hit the limit.  At that point, filter will return true and block.
      Allow2Ban.filter("scrapers/#{req.ip}", maxretry: 30, findtime: 1.minute, bantime: 3.minutes) do
        # The count for the IP is incremented if the return value is truthy.
        req.path.include?('/users') && req.post?
      end
    end

    # Using 503 because it may make attacker think that they have successfully
    # DOSed the site. Rack::Attack returns 403 for blocklists by default
    self.blocklisted_responder = lambda do |_request|
      # Using 503 because it may make attacker think that they have successfully
      # DOSed the site. Rack::Attack returns 403 for blocklists by default
      [503, {}, ['(Blocked) Service Unavailable']]
    end

    # Using 503 because it may make attacker think that they have successfully
    # DOSed the site. Rack::Attack returns 429 for throttling by default
    self.throttled_responder = lambda do |_request|
      # NB: you have access to the name and other data about the matched throttle
      #  in `request.env['rack.attack.matched']`
      # Using 503 because it may make attacker think that they have successfully
      # DOSed the site. Rack::Attack returns 429 for throttling by default
      [503, {}, ['(Throttled) Service Unavailable']]
    end

    # Always allow requests from localhost
    # safelist('allow from localhost') do |req|
    #   req.ip.in?(['127.0.0.1'])
    # end

    # Log blocked requests to Rails.logger using a custom formatter object
  end
end

# ActiveSupport::Notifications.subscribe('throttle.rack_attack') do |name, _start, _finish, _request_id, payload|
#   # request object available in payload[:request]
#   Sentry.capture_message(name, **payload) if Rails.env.production?
#   Rails.logger.error "[Rack::Attack][#{name}] #{payload.inspect}"
#   # Your code here
# end
