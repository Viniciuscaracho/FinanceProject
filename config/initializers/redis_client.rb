# frozen_string_literal: true

# Redis client
module RedisClient
  class << self
    def current
      return @current if defined?(@current) && @current
      
      @current = begin
        redis = Redis.new(
          url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1'),
          reconnect_attempts: 1,
          reconnect_delay: 0.1,
          reconnect_delay_max: 0.5
        )
        # Testar conexão
        redis.ping
        redis
      rescue Redis::CannotConnectError, Errno::ECONNREFUSED, Redis::ConnectionError => e
        Rails.logger.warn "Redis não disponível: #{e.message}. Aplicação continuará sem cache/sessões Redis."
        @current = RedisMock.new
      end
    end

    # Verifica se o Redis está disponível
    def available?
      return false if @current.is_a?(RedisMock)
      
      begin
        @current&.ping == 'PONG'
      rescue Redis::CannotConnectError, Errno::ECONNREFUSED, Redis::ConnectionError
        @current = RedisMock.new
        false
      end
    end

    # Reseta a conexão (útil para testes ou reconexão)
    def reset!
      @current = nil
    end
  end

  # Mock do Redis para quando não estiver disponível
  class RedisMock
    def get(key)
      nil
    end

    def setex(key, ttl, value)
      nil
    end

    def del(*keys)
      0
    end

    def keys(pattern)
      []
    end

    def scan(cursor, match: nil, count: nil)
      [0, []]
    end

    def ping
      raise Redis::CannotConnectError, 'Redis não disponível'
    end
  end
end
