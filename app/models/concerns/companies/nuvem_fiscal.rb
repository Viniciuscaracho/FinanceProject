# frozen_string_literal: true

module Companies
  # Pluggy helper class for account
  module NuvemFiscal
    extend ActiveSupport::Concern

    def nuvem_fiscal_empresa
      nuvem_fiscal_relationships(external_entity: 'empresas').last
    end

    def nuvem_fiscal_empresa_synced?
      nuvem_fiscal_empresa&.sender_synced?
    end

    protected

    def nuvem_fiscal_relationships(external_entity: nil)
      nuvem_fiscal_store.relationship_stores.where(internal_entity: self.class.table_name, internal_id: id, external_entity:)
    end

    def nuvem_fiscal_store
      IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(account.id)
    end
  end
end
