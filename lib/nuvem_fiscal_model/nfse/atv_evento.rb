# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "xNome": "string",
    #   "dtIni": "2019-08-24",
    #   "dtFim": "2019-08-24",
    #   "idAtvEvt": "string",
    #   "end": {} # End object
    # }
    class AtvEvento < NuvemFiscalModel::Base
      attr_accessor :xNome, :dtIni, :dtFim, :idAtvEvt, :end

      validates :xNome, :dtIni, :dtFim, presence: true

      validates :xNome, length: { maximum: 255 }
      validates :dtIni, :dtFim, format: { with: /\d{4}-\d{2}-\d{2}/ }

      def initialize(attributes = {})
        @end = End.new(attributes[:end]) if attributes[:end].present?
        super
      end
    end
  end
end