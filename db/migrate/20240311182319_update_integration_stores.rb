# frozen_string_literal: true

class UpdateIntegrationStores < ActiveRecord::Migration[7.0]
  def change
    pluggy = IntegrationStore.find_by(name: Integrations::Pluggy::NAME,
                                      store_type_cd: IntegrationStore::STORE_TYPES[:open_banking])
    if pluggy.present?
      pluggy.update!(
        type: 'IntegrationStores::Pluggy',
        description: 'Integre com a sua conta bancária através do Open Finance e facilite as conciliações bancárias e cartão de crédito.'
      )
    end

    nuvem_fiscal = IntegrationStore.find_by(name: Integrations::NuvemFiscal::NAME,
                                            store_type_cd: IntegrationStore::STORE_TYPES[:invoicing])
    if nuvem_fiscal.present?
      nuvem_fiscal.update!(
        type: 'IntegrationStores::NuvemFiscal',
        description: 'Integre com a prefeitura de sua cidade e emita NFS-e diretamente do Procfy.'
      )
    end
  end
end
