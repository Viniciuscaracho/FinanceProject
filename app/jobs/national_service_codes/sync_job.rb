# frozen_string_literal: true

module NationalServiceCodes
  class SyncJob < ApplicationJob
    queue_as :default

    def perform
      process_xlsx { |row| process_row(row) }
    end

    private

    def headers
      {
        key: /CÓDIGOS DE TRIBUTAÇÃO NACIONAL/,
        value: /DESCRIÇÃO/,
        item: /ITEM/,
        sub_item: /SUBITEM/,
        subdivision: /DESDOBRO NACIONAL/
      }
    end

    def process_xlsx(&block)
      file = URI.open('https://www.gov.br/nfse/pt-br/biblioteca/eventos_NFS-e/evento-tecnico-setembro-de-2022/anexob-listasservnac_nbs-snnfse_v1-01-00-homologacao.xlsx/@@download/file')
      doc = SimpleXlsxReader.open(file)
      rows = doc.sheets.first.rows
      rows.each(headers:, &block)
    end

    def process_row(row)
      return if row[:key].blank?

      key = row[:key].to_s.rjust(6, '0')
      service_code = NationalServiceCode.find_or_initialize_by(key:)
      service_code.assign_attributes(value: row[:value], metadata: { item: row[:item], sub_item: row[:sub_item], subdivision: row[:subdivision] })
      service_code.save!
    end
  end
end
