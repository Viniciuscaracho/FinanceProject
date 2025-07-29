# frozen_string_literal: true
module Api
  class PermissionDenied < StandardError
    def initialize(msg = I18n.t('errors.permission_denied.message'))
      super
    end

    def name
      I18n.t('errors.permission_denied.title')
    end

    def http_status
      :forbidden
    end
  end
end
