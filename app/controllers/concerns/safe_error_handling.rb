module SafeErrorHandling
  extend ActiveSupport::Concern

  def render_internal_error(exception, message: 'Erro interno do servidor', status: :internal_server_error)
    Rails.logger.error "#{self.class.name} error: #{exception.class}: #{exception.message}"
    Rails.logger.error exception.backtrace.first(5).join("\n")
    return if performed?
    render json: { error: message }, status: status
  end
end
