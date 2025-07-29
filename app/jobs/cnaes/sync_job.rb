# frozen_string_literal: true

module Cnaes
  class SyncJob < ApplicationJob
    queue_as :default

    def perform
      # Load CNAE from IBGE API
      HTTParty.get('https://servicodados.ibge.gov.br/api/v2/cnae/subclasses').each do |attributes|
        cnae = Cnae.find_or_initialize_by(key: attributes['id'])
        cnae.assign_attributes(
          value: attributes['descricao'],
          metadata: {
            atividades: attributes['atividades'],
            observacoes: attributes['observacoes']
          }
        )
        cnae.save!
      end
    end
  end
end
