# frozen_string_literal: true

# Concern para gerenciamento de cache isolado por conta
# Cada endpoint pode ter seu próprio namespace de cache, garantindo isolamento entre contas
module AccountCache
  extend ActiveSupport::Concern

  private

  # Retorna o cache store (Rails.cache já está configurado com namespace)
  # O namespace é adicionado na chave do cache
  def account_cache_store(endpoint_namespace = nil)
    Rails.cache
  end

  # Gera uma chave de cache única para a conta e endpoint
  def cache_key(*parts, endpoint_namespace: nil)
    base_key = build_cache_namespace(endpoint_namespace)
    key_parts = [base_key, *parts].compact
    key_parts.join(':')
  end

  # Busca ou calcula um valor do cache
  # Cada endpoint gerencia seu próprio cache de forma independente
  def fetch_from_cache(key, options = {}, endpoint_namespace: nil, &block)
    full_key = cache_key(key, endpoint_namespace: endpoint_namespace)
    cache_store = account_cache_store(endpoint_namespace)

    begin
      cache_store.fetch(full_key, options) do
        Rails.logger.debug "Cache miss para: #{full_key}"
        yield if block_given?
      end
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED, Redis::ConnectionError => e
      Rails.logger.warn "Redis não disponível para cache, executando sem cache: #{e.message}"
      # Se Redis não estiver disponível, executar o bloco diretamente sem cache
      yield if block_given?
    end
  end

  # Limpa o cache de um endpoint específico para a conta atual
  def clear_endpoint_cache(endpoint_namespace)
    return unless Current.account

    namespace = build_cache_namespace(endpoint_namespace)
    # O namespace já está incluído no cache_key, então precisamos buscar todas as chaves
    pattern = "#{Rails.application.config.cache_store[1][:namespace] || 'cache'}:#{namespace}:*"
    
    clear_cache_by_pattern(pattern)
    Rails.logger.info "Cache limpo para endpoint: #{endpoint_namespace}, account: #{Current.account.id}"
  end

  # Limpa todo o cache de uma conta
  def clear_account_cache
    return unless Current.account

    namespace_prefix = Rails.application.config.cache_store[1][:namespace] || 'cache'
    pattern = "#{namespace_prefix}:account:#{Current.account.id}:*"
    
    clear_cache_by_pattern(pattern)
    Rails.logger.info "Todo o cache limpo para account: #{Current.account.id}"
  end

  # Invalida cache baseado em tags (útil para invalidação seletiva)
  def invalidate_cache_by_tags(*tags, endpoint_namespace: nil)
    return unless Current.account

    namespace_prefix = Rails.application.config.cache_store[1][:namespace] || 'cache'
    namespace = build_cache_namespace(endpoint_namespace)
    
    tags.each do |tag|
      pattern = "#{namespace_prefix}:#{namespace}:tag:#{tag}:*"
      clear_cache_by_pattern(pattern)
    end

    Rails.logger.info "Cache invalidado por tags: #{tags.join(', ')}"
  end

  # Método auxiliar para limpar cache por padrão usando Redis
  def clear_cache_by_pattern(pattern)
    begin
      redis = RedisClient.current
      cursor = 0
      deleted_count = 0
      
      loop do
        cursor, keys = redis.scan(cursor, match: pattern, count: 100)
        if keys.any?
          deleted = redis.del(*keys)
          deleted_count += deleted
        end
        break if cursor.to_i.zero?
      end
      
      Rails.logger.debug "Cache limpo: #{deleted_count} chaves removidas com padrão: #{pattern}"
      deleted_count
    rescue Redis::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis não disponível, pulando limpeza de cache: #{e.message}"
      0
    end
  end

  # Gera o namespace do cache baseado na conta e endpoint
  def build_cache_namespace(endpoint_namespace = nil)
    parts = ['account', Current.account&.id]
    parts << endpoint_namespace if endpoint_namespace.present?
    parts.compact.join(':')
  end

  # Retorna o namespace do endpoint atual baseado no controller e action
  def current_endpoint_namespace
    "#{controller_name}:#{action_name}"
  end

  # Helper para cache com TTL padrão
  def cache_with_ttl(key, ttl: 1.hour, endpoint_namespace: nil, &block)
    fetch_from_cache(
      key,
      { expires_in: ttl },
      endpoint_namespace: endpoint_namespace,
      &block
    )
  end
end

