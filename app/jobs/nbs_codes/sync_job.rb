# frozen_string_literal: true

module NbsCodes
  class SyncJob < ApplicationJob
    queue_as :default

    def perform
      process_xlsx { |row| process_row(row) }
    end

    private

    def headers
      { key: /CÓDIGO NBS/, value: /DESCRIÇÃO/ }
    end

    def process_xlsx(&block)
      file = URI.open('https://www.gov.br/nfse/pt-br/biblioteca/eventos_NFS-e/evento-tecnico-setembro-de-2022/anexob-listasservnac_nbs-snnfse_v1-01-00-homologacao.xlsx/@@download/file')
      doc = SimpleXlsxReader.open(file)
      rows = doc.sheets.second.rows
      rows.each(headers:, &block)
    end

    def process_row(row)
      return if row[:key].blank?
      return unless row[:key].to_s.length == 12

      key = row[:key].to_s
      nbs_code = NbsCode.find_or_initialize_by(key:)
      nbs_code.assign_attributes(value: row[:value])
      nbs_code.save!
    end
  end
end
