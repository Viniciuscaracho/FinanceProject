# frozen_string_literal: true

# == Schema Information
#
# Table name: integration_stores
#
#  id            :bigint           not null, primary key
#  description   :text
#  integrated_at :datetime
#  name          :string           not null
#  state         :string
#  store_type_cd :integer          not null
#  type          :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint
#  parent_id     :bigint
#
# Indexes
#
#  idx_integrations_stores_uniq            (type,store_type_cd,account_id) UNIQUE
#  index_integration_stores_on_account_id  (account_id)
#  index_integration_stores_on_parent_id   (parent_id)
#  index_integration_stores_on_state       (state)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
module IntegrationStores
  class NuvemFiscal < IntegrationStore
    include Integrations::NuvemFiscal

    as_enum :state, %i[welcome comany nfse_config certificate done], source: :state, map: :string

    after_initialize do
      self.name = Integrations::NuvemFiscal::NAME if name.blank?
    end

    belongs_to :parent_store, class_name: 'IntegrationStores::NuvemFiscal', foreign_key: :parent_id, optional: true
    has_many :integration_stores, class_name: 'IntegrationStores::NuvemFiscal', foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent_store


    def integrated?
      account.company.nuvem_fiscal_empresa.present? &&
      account.company.nfse_config.present? &&
      account.company.nfse_config.nuvem_fiscal_configuracao_nfse.present? &&
      account.company.nfse_config.nuvem_fiscal_certificado.present?
    end
  end
end
