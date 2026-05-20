# frozen_string_literal: true

module Rack
  class Attack
    default_enabled = Rails.env.production? || Rails.env.staging?
    self.enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch('RACK_ATTACK_ENABLED', default_enabled))

    # Use Redis as cache store when available for distributed rate limiting
    self.cache.store = Rails.cache

    ### ALLOWLISTS ###

    # Trusted IPs bypass all throttles (for E2E test runners, office IPs, etc.)
    # Set RACK_ATTACK_TRUSTED_IPS=1.2.3.4,5.6.7.8 in env
    safelist('allow/trusted_ips') do |req|
      trusted = ENV.fetch('RACK_ATTACK_TRUSTED_IPS', '').split(',').map(&:strip).reject(&:empty?)
      trusted.include?(req.ip)
    end

    # Always allow internal/health requests
    safelist('allow/health') do |req|
      req.path == '/health_check'
    end

    ### THROTTLES ###

    # Global: 60 req/10s per IP (6 req/s) — allows burst but stops floods
    throttle('req/ip/global', limit: 60, period: 10.seconds) do |req|
      req.ip unless req.path.start_with?('/assets', '/rails/active_storage', '/cable')
    end

    # API: 30 req/10s per IP
    throttle('req/ip/api', limit: 30, period: 10.seconds) do |req|
      req.ip if req.path.start_with?('/api')
    end

    # Auth endpoints: 5 attempts/minute per IP
    throttle('auth/ip', limit: 5, period: 1.minute) do |req|
      req.ip if req.post? && req.path.match?(%r{/api/v1/auth/(login|register|login_simple|firebase_login|supabase_login)})
    end

    # Auth endpoints: 5 attempts/minute per email (brute force on specific accounts)
    throttle('auth/email', limit: 5, period: 1.minute) do |req|
      if req.post? && req.path.match?(%r{/api/v1/auth/(login|register|login_simple)})
        body = req.body.read
        req.body.rewind
        email = JSON.parse(body)['email'].to_s.downcase.strip rescue nil
        email.presence
      end
    end

    # Register specifically: 3 accounts/hour per IP (prevent mass account creation)
    throttle('register/ip/hour', limit: 3, period: 1.hour) do |req|
      req.ip if req.post? && req.path.include?('/auth/register')
    end

    # Public booking endpoints: 20 req/10s per IP (protect scheduler from scraping)
    throttle('req/ip/public_booking', limit: 20, period: 10.seconds) do |req|
      req.ip if req.path.start_with?('/api/v1/public/')
    end

    # Public discover/search: 10 req/30s per IP (prevent directory scraping)
    throttle('req/ip/discover', limit: 10, period: 30.seconds) do |req|
      req.ip if req.path.start_with?('/api/v1/public/discover')
    end

    # Webhooks: stricter, only known IPs should call (150/min is generous for Stripe/AbacatePay)
    throttle('req/ip/webhooks', limit: 150, period: 1.minute) do |req|
      req.ip if req.path.start_with?('/webhooks')
    end

    ### BLOCKLISTS ###

    # Block and auto-ban IPs probing for known vulnerabilities / scanner patterns
    blocklist('block/scanners') do |req|
      Fail2Ban.filter("scanners/#{req.ip}", maxretry: 3, findtime: 5.minutes, bantime: 1.hour) do
        path = req.path.downcase
        qs   = CGI.unescape(req.query_string).downcase rescue ''

        path.match?(%r{/etc/passwd|/etc/shadow|\.env|\.git/config|wp-admin|wp-login|phpmyadmin|xmlrpc|actuator/|\.php$}) ||
          qs.include?('/etc/passwd') ||
          req.user_agent.to_s.match?(/sqlmap|nikto|masscan|zgrab|nmap|dirbuster|gobuster|wfuzz|nuclei/i)
      end
    end

    # Ban IPs hammering login after limit breach (additional layer on top of throttle)
    blocklist('block/login_bruteforce') do |req|
      Allow2Ban.filter("login_bruteforce/#{req.ip}", maxretry: 10, findtime: 1.minute, bantime: 30.minutes) do
        req.post? && req.path.match?(%r{/api/v1/auth/(login|login_simple)})
      end
    end

    # Block POST flood on any single path
    blocklist('block/post_flood') do |req|
      Allow2Ban.filter("post_flood/#{req.ip}", maxretry: 100, findtime: 1.minute, bantime: 10.minutes) do
        req.post?
      end
    end

    ### RESPONSES ###

    # Return 503 so attackers think they succeeded (don't reveal rate limiting)
    self.blocklisted_responder = ->(_req) { [503, { 'Content-Type' => 'text/plain' }, ['Service Unavailable']] }
    self.throttled_responder   = ->(_req) { [503, { 'Content-Type' => 'text/plain' }, ['Service Unavailable']] }
  end
end

# Log all blocked/throttled requests to Rails.logger
ActiveSupport::Notifications.subscribe('rack.attack') do |_name, _start, _finish, _req_id, payload|
  req = payload[:request]
  match_type = req.env['rack.attack.match_type']
  next unless %i[throttle blocklist].include?(match_type)

  Rails.logger.warn "[RackAttack][#{match_type}] IP=#{req.ip} Path=#{req.path} Rule=#{req.env['rack.attack.matched']}"
end
