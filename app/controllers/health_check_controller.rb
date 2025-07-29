# frozen_string_literal: true

class HealthCheckController < ActionController::API
  def index
    response = {
      db: database_connected?,
      cache: redis_connected?,
      is_green: green?
    }

    if green?
      render json: response, status: :ok
    else
      render json: response, status: :service_unavailable
    end
  end

  private

  def green?
    database_connected? && redis_connected?
  end

  def database_connected?
    ApplicationRecord.connection.select_value('SELECT 1') == 1
  rescue StandardError
    false
  end

  def redis_connected?
    RedisClient.current.ping == 'PONG'
  rescue StandardError
    false
  end
end
