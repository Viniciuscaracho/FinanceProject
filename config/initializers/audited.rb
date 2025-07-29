# frozen_string_literal: true

# https://github.com/collectiveidea/audited
Rails.configuration.to_prepare do
  Audited.config do |config|
    config.audit_class = ::Audit
    config.max_audits = 10
    config.store[:audited_user] = I18n.t('shared.system')
  end
end
