# frozen_string_literal: true

class JsonErrorHandler
  def initialize(app)
    @app = app
  end

  def call(env)
    begin
      @app.call(env)
    rescue => e
      # Verificar se é uma requisição da API
      if env['PATH_INFO']&.start_with?('/api/')
        # Log do erro
        Rails.logger.error "=== Erro não tratado na API ==="
        Rails.logger.error "Path: #{env['PATH_INFO']}"
        Rails.logger.error "Exception: #{e.class.name}"
        Rails.logger.error "Message: #{e.message}"
        Rails.logger.error "Backtrace:"
        Rails.logger.error e.backtrace.join("\n")
        
        # Retornar JSON de erro
        error_response = {
          success: false,
          error: "Erro interno do servidor: #{e.message}",
          message: e.message
        }
        
        if Rails.env.development?
          error_response[:details] = e.backtrace.first(10)
        end
        
        [
          500,
          { 'Content-Type' => 'application/json' },
          [error_response.to_json]
        ]
      else
        # Para requisições não-API, deixar o Rails tratar normalmente
        raise e
      end
    end
  end
end

