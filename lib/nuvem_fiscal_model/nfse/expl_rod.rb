# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "categVeic": "string",
    #   "nEixos": "string",
    #   "rodagem": 0,
    #   "sentido": "string",
    #   "placa": "string",
    #   "codAcessoPed": "string",
    #   "codContrato": "string"
    # }
    class ExplRod < NuvemFiscalModel::Base
      attr_accessor :categVeic, :nEixos, :rodagem, :sentido, :placa, :codAcessoPed, :codContrato

      validates :categVeic, :nEixos, :rodagem, :sentido, :placa, :codAcessoPed, :codContrato, presence: true

      validates :nEixos, numericality: { only_integer: true }

      # 00 - Categoria de veículos (tipo não informado na nota de origem)
      # 01 - Automóvel, caminhonete e furgão
      # 02 - Caminhão leve, ônibus, caminhão trator e furgão
      # 03 - Automóvel e caminhonete com semireboque
      # 04 - Caminhão, caminhão-trator, caminhão-trator com semi-reboque e ônibus
      # 05 - Automóvel e caminhonete com reboque
      # 06 - Caminhão com reboque
      # 07 - Caminhão trator com semi-reboque
      # 08 - Motocicletas, motonetas e bicicletas motorizadas
      # 09 - Veículo especial
      # 10 - Veículo Isento
      validates :categVeic, inclusion: { in: %w[00 01 02 03 04 05 06 07 08 09 10] }
    end
  end
end
