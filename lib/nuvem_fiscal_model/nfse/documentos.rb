# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "docDedRed": [
    #     {}, # DocDedRed Object
    #   ]
    # }
    class Documentos < NuvemFiscalModel::Base
      attr_accessor :docDedRed

      validates :docDedRed, presence: true

      def initialize(attributes = {})
        if attributes[:docDedRed].present?
          attributes[:docDedRed].map! { |doc| NuvemFiscalModel::Nfse::DocDedRed.new(doc) }
        end
        super
      end
    end
  end
end
