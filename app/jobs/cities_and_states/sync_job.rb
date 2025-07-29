# frozen_string_literal: true

module CitiesAndStates
  class SyncJob < ApplicationJob
    queue_as :default

    def perform
      # Load CNAE from IBGE API
      HTTParty.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados').each do |state_attrs|
        state = State.find_or_initialize_by(key: state_attrs['sigla'])
        state.assign_attributes(value: state_attrs['nome'])
        state.save!

        HTTParty.get("https://servicodados.ibge.gov.br/api/v1/localidades/estados/#{state.key}/municipios").each do |city_attrs|
          city = state.cities.find_or_initialize_by(key: city_attrs['id'])
          city.assign_attributes(value: city_attrs['nome'])
          city.save!
        end
      end

      nil
    end
  end
end
