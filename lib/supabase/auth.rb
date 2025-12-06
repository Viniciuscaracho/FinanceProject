# frozen_string_literal: true

module Supabase
  module Auth
    # Verifica e valida um token JWT do Supabase
    def self.verify_token(token)
      return nil unless token.present?
      
      begin
        # Decodificar o token JWT sem verificar a assinatura primeiro para obter o header
        decoded_token = JWT.decode(
          token,
          nil,
          false,
          { algorithm: 'HS256' }
        )
        
        payload = decoded_token[0]
        header = decoded_token[1]
        
        # Verificar se o token não expirou
        if payload['exp'] && Time.current.to_i > payload['exp']
          return nil
        end
        
        # Verificar assinatura usando o JWT secret do Supabase
        jwt_secret = Rails.application.config.supabase[:jwt_secret]
        return nil unless jwt_secret.present?
        
        JWT.decode(
          token,
          jwt_secret,
          true,
          { algorithm: 'HS256' }
        )
        
        payload
      rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError => e
        Rails.logger.error "Supabase Auth: Erro ao verificar token - #{e.message}"
        nil
      end
    end
    
    # Obtém o usuário do Supabase a partir do token
    def self.get_user_from_token(token)
      payload = verify_token(token)
      return nil unless payload
      
      # O payload do Supabase contém informações do usuário
      user_id = payload['sub'] || payload['user_id']
      return nil unless user_id
      
      # Buscar ou criar usuário no banco local baseado no Supabase user_id
      # Usar provider='supabase' e uid=user_id para compatibilidade com sistema existente
      user = User.find_by(provider: 'supabase', uid: user_id)
      
      # Se não encontrou, criar novo
      if user.nil?
        user = User.new(provider: 'supabase', uid: user_id)
        user.email = payload['email']
        user.first_name = payload['user_metadata']&.dig('first_name') || payload['user_metadata']&.dig('full_name')&.split(' ')&.first || ''
        user.last_name = payload['user_metadata']&.dig('last_name') || payload['user_metadata']&.dig('full_name')&.split(' ')&.last || ''
        user.password = Devise.friendly_token[0, 20] # Senha aleatória, não será usada
        user.accepted_terms_at = Time.current
        user.accepted_privacy_at = Time.current
        
        # Criar conta padrão se necessário
        if user.new_record? && user.accounts.empty?
          account = Account.create!(
            name: "Conta Principal",
            account_type: 'personal',
            default_currency: 'BRL'
          )
          user.accounts << account
        end
        
        user.save!
      else
        # Atualizar dados do usuário existente
        user.update(
          email: payload['email'],
          first_name: payload['user_metadata']&.dig('first_name') || user.first_name,
          last_name: payload['user_metadata']&.dig('last_name') || user.last_name
        )
      end
      
      user
    end
    
    # Cria um token de acesso para o usuário (compatível com o sistema atual)
    def self.generate_access_token(user)
      payload = {
        user_id: user.id,
        email: user.email,
        exp: 24.hours.from_now.to_i
      }
      
      # Usar a mesma chave de criptografia do Rails ou criar uma específica
      secret = Rails.application.credentials.dig(:encryption_primary_key) || 
               Rails.application.secret_key_base
      
      JWT.encode(payload, secret, 'HS256')
    end
  end
end

