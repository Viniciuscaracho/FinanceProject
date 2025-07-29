# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "vReceb": 0,
    #   "vServ": 0
    # }
    class VServPrest < NuvemFiscalModel::Base
      attr_accessor :vReceb, :vServ

      validates :vServ, presence: true
    end
  end
end