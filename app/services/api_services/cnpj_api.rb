# frozen_string_literal: true

module ApiServices
  # This class is responsible for retrieving data from the CNPJ API.
  class CnpjApi
    include HTTParty

    base_uri 'https://api.leadfinder.com.br/integracao/cnpj'
    TOKEN = '8FDFC6B6CC9546745DAD591FAB506941C17D036980AE4D5ED2228940B3434F5A'

    def self.get_cnpj(cnpj)
      headers = {
        "Authorization": TOKEN.to_s
      }
      response = get("/#{cnpj}", headers:)

      return response.parsed_response.symbolize_keys if response.success?

      {}
    end
  end
end
