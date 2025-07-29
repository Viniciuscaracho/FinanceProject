# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    #  {
    #     "tpAmb": 0,
    #     "dhEmi": "2019-08-24T14:15:22Z",
    #     "verAplic": "string",
    #     "dCompet": "2019-08-24",
    #     "subst": {},   # Substituicao Object
    #     "prest": {},   # Prestador Object
    #     "toma": {},    # Tomador Object
    #     "interm": {},  # Intermediario Object
    #     "serv": {},    # Servico Object
    #     "valores": {}  # Valores Object
    #   }
    class InfDps < NuvemFiscalModel::Base
      attr_accessor :tpAmb, :dhEmi, :verAplic, :dCompet, :subst, :prest, :toma, :interm, :serv, :valores

      validates :dhEmi, :dCompet, :prest, :toma, :serv, :valores, presence: true

      validates :tpAmb, inclusion: { in: [1, 2] }
      validates :verAplic, length: { maximum: 20 }

      # validates format AAAA-MM-DD
      validates :dCompet, format: { with: /\d{4}-\d{2}-\d{2}/ }

      # validates format UTC (Universal Coordinated Time): AAAA-MM-DDThh:mm:ssTZD
      validates :dhEmi, format: { with: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/ }

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'subst'
                    Substituicao.new(value)
                  when 'prest'
                    Prestador.new(value)
                  when 'toma'
                    Tomador.new(value)
                  when 'interm'
                    Intermediario.new(value)
                  when 'serv'
                    Servico.new(value)
                  when 'valores'
                    Valores.new(value)
                  else
                    value
                  end
          send("#{name}=", value)
        end
        super
      end
    end
  end
end