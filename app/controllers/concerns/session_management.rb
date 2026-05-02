# frozen_string_literal: true

# Concern para gerenciamento de sessões usando Redis
# Fornece controle de sessões por usuário e conta, com expiração automática
module SessionManagement
  extend ActiveSupport::Concern

  included do
    # A sessão será criada/atualizada após cada requisição bem-sucedida
    after_action :refresh_session, if: :session_required?
  end

  private

  # Verifica se a sessão é válida e não expirou (opcional, pode ser chamado manualmente)
  def validate_session!
    return unless Current.user && Current.account

    begin
      session_key = session_key_for(Current.user.id, Current.account.id)
      session_data = RedisClient.current.get(session_key)

      unless session_data
        Rails.logger.warn "Sessão não encontrada ou expirada para user_id: #{Current.user.id}, account_id: #{Current.account.id}"
        return false
      end

      # Verificar se a sessão ainda é válida
      session_info = JSON.parse(session_data)
      if session_info['expires_at'] && Time.parse(session_info['expires_at']) < Time.current
        Rails.logger.warn "Sessão expirada para user_id: #{Current.user.id}"
        invalidate_session(session_key)
        return false
      end

      # Atualizar informações da sessão
      @session_key = session_key
      @session_info = session_info
      true
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, validando sessão sem cache: #{e.message}"
      # Se Redis não estiver disponível, permitir continuar sem validação de sessão
      true
    end
  end

  # Atualiza a sessão após cada requisição bem-sucedida
  # Se não existir, cria uma nova
  def refresh_session
    return unless Current.user && Current.account

    begin
      # Se já temos uma chave de sessão, usar ela, senão criar nova
      session_key = @session_key || session_key_for(Current.user.id, Current.account.id)
      session_ttl = session_ttl_seconds
      session_data = {
        user_id: Current.user.id,
        account_id: Current.account.id,
        ip_address: request.remote_ip,
        user_agent: request.user_agent,
        last_activity_at: Time.current.iso8601,
        expires_at: (Time.current + session_ttl.seconds).iso8601
      }

      RedisClient.current.setex(session_key, session_ttl, session_data.to_json)
      @session_key = session_key
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, pulando refresh de sessão: #{e.message}"
      # Se Redis não estiver disponível, continuar sem atualizar sessão
    end
  end

  # Cria uma nova sessão para o usuário e conta
  def create_session(user, account)
    begin
      session_key = session_key_for(user.id, account.id)
      session_ttl = session_ttl_seconds

      session_data = {
        user_id: user.id,
        account_id: account.id,
        ip_address: request.remote_ip,
        user_agent: request.user_agent,
        created_at: Time.current.iso8601,
        last_activity_at: Time.current.iso8601,
        expires_at: (Time.current + session_ttl.seconds).iso8601
      }

      RedisClient.current.setex(session_key, session_ttl, session_data.to_json)
      session_key
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, criando sessão sem cache: #{e.message}"
      # Retornar uma chave de sessão fake se Redis não estiver disponível
      session_key_for(user.id, account.id)
    end
  end

  # Invalida uma sessão específica
  def invalidate_session(session_key = nil)
    key = session_key || session_key_for(Current.user&.id, Current.account&.id)
    return unless key

    begin
      RedisClient.current.del(key)
      Rails.logger.info "Sessão invalidada: #{key}"
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, pulando invalidação de sessão: #{e.message}"
    end
  end

  # Invalida todas as sessões de um usuário
  def invalidate_all_user_sessions(user_id)
    begin
      pattern = "session:user:#{user_id}:account:*"
      keys = RedisClient.current.keys(pattern)
      RedisClient.current.del(*keys) if keys.any?
      Rails.logger.info "Todas as sessões invalidadas para user_id: #{user_id}"
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, pulando invalidação de sessões: #{e.message}"
    end
  end

  # Invalida todas as sessões de uma conta
  def invalidate_all_account_sessions(account_id)
    begin
      pattern = "session:user:*:account:#{account_id}"
      keys = RedisClient.current.keys(pattern)
      RedisClient.current.del(*keys) if keys.any?
      Rails.logger.info "Todas as sessões invalidadas para account_id: #{account_id}"
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, pulando invalidação de sessões: #{e.message}"
    end
  end

  # Gera a chave da sessão no Redis
  def session_key_for(user_id, account_id)
    "session:user:#{user_id}:account:#{account_id}"
  end

  # TTL da sessão em segundos (padrão: 24 horas)
  def session_ttl_seconds
    ENV.fetch('SESSION_TTL_SECONDS', 86_400).to_i # 24 horas
  end

  # Verifica se a sessão é necessária para este controller/action
  def session_required?
    true # Por padrão, todas as ações requerem sessão
  end
end

