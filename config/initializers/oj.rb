# frozen_string_literal: true

Rails.configuration.to_prepare do
  Oj.optimize_rails
  # Rails.logger.debug '-- Oj.optimize_rails - initialized'
end
