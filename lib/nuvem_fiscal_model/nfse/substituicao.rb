# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #     {
    #       "chSubstda": "string",
    #       "cMotivo": "string",
    #       "xMotivo": "string"
    #     }
    class Substituicao < NuvemFiscalModel::Base
      attr_accessor :chSubstda, :cMotivo, :xMotivo

      validates :chSubstda, :cMotivo, presence: true

      # chSubstda <= 50 chars
      validates :chSubstda, length: { maximum: 50 }

      # 01 - Desenquadramento de NFS-e do Simples Nacional
      # 02 - Enquadramento de NFS-e no Simples Nacional
      # 03 - Inclusão Retroativa de Imunidade/Isenção para NFS-e
      # 04 - Exclusão Retroativa de Imunidade/Isenção para NFS-e
      # 05 - Rejeição de NFS-e pelo tomador ou pelo intermediário se responsável pelo recolhimento do tributo
      # 99 - Outros
      validates :cMotivo, inclusion: { in: %w[01 02 03 04 05 99] }
    end
  end
end
