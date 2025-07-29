# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "cObra": "string",
    #   "inscImobFisc": "string",
    #   "end": {}, # End object
    # }
    class Obra < NuvemFiscalModel::Base
      attr_accessor :cObra, :inscImobFisc, :end

      validates :cObra, :inscImobFisc, length: { maximum: 30 }

      def initialize(attributes = {})
        @end = End.new(attributes[:end]) if attributes[:end].present?
        super
      end
    end
  end
end