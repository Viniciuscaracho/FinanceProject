# frozen_string_literal: true

# Integration module will be the main concern module for everything related to the integration store
module Integrations
  # Nuvem Fiscal helper class
  module NuvemFiscal
    extend ActiveSupport::Concern

    NAME = 'nuvem_fiscal'

    included do
      # these static helper will make it easier to access the pluggy integration through console for maintenance
      def self.nuvem_fiscal(account_id: nil, parent_id: nil)
        IntegrationStores::NuvemFiscal.find_by(
          store_type_cd: IntegrationStore::STORE_TYPES[:invoicing],
          account_id:,
          parent_id:
        )
      end

      # for all the following methods, add nuvem_fiscal_ prefix to avoid conflicts with other integrations
      def self.nuvem_fiscal_config
        nuvem_fiscal.config
      end

      def self.nuvem_fiscal_endpoint(name)
        nuvem_fiscal.endpoint(name)
      end

      def self.nuvem_fiscal_account_store(account_id)
        global = nuvem_fiscal
        account_store = nuvem_fiscal(account_id:, parent_id: global.id)

        # if account_store is not found, create it
        if account_store.blank?
          account_store = IntegrationStores::NuvemFiscal.create!(
            store_type_cd: IntegrationStore::STORE_TYPES[:invoicing],
            parent_id: global.id,
            account_id:
          )
        end
        account_store
      end
    end
  end
end
