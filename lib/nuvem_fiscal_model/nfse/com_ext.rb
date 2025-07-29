# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "mdPrestacao": 0,
    #   "vincPrest": 0,
    #   "tpMoeda": "str",
    #   "vServMoeda": 0,
    #   "mecAFComexP": "string",
    #   "mecAFComexT": "string",
    #   "movTempBens": 0,
    #   "nDI": "string",
    #   "nRE": "string",
    #   "mdic": 0
    # }
    class ComExt < NuvemFiscalModel::Base
      attr_accessor :mdPrestacao, :vincPrest, :tpMoeda, :vServMoeda, :mecAFComexP, :mecAFComexT, :movTempBens, :nDI,
                    :nRE, :mdic

      validates :mdPrestacao, :vincPrest, :tpMoeda, :vServMoeda, :mecAFComexP, :mecAFComexT, :movTempBens, :mdic,
                presence: true

      validates :mdPrestacao, :vincPrest, :vServMoeda, :movTempBens, :mdic, numericality: { only_integer: true }
      validates :tpMoeda, length: { maximum: 3 }
      validates :nDI, :nRE, length: { maximum: 12 }

      # 0 - Desconhecido (tipo não informado na nota de origem)
      # 1 - Transfronteiriço
      # 2 - Consumo no Brasil
      # 3 - Presença Comercial no Exterior
      # 4 - Movimento Temporário de Pessoas Físicas
      validates :mdPrestacao, inclusion: { in: [0, 1, 2, 3, 4] }

      # 0 - Sem vínculo com o tomador/ Prestador
      # 1 - Controlada
      # 2 - Controladora
      # 3 - Coligada
      # 4 - Matriz
      # 5 - Filial ou sucursal
      # 6 - Outro vínculo
      validates :vincPrest, inclusion: { in: [0, 1, 2, 3, 4, 5, 6] }

      # 00 - Desconhecido (tipo não informado na nota de origem)
      # 01 - Nenhum
      # 02 - ACC - Adiantamento sobre Contrato de Câmbio - Redução a Zero do IR e do IOF
      # 03 - ACE - Adiantamento sobre Cambiais Entregues - Redução a Zero do IR e do IOF
      # 04 - BNDES-Exim Pós-Embarque - Serviços
      # 05 - BNDES-Exim Pré-Embarque - Serviços
      # 06 - FGE - Fundo de Garantia à Exportação
      # 07 - PROEX - EQUALIZAÇÃO
      # 08 - PROEX - Financiamento
      validates :mecAFComexP, inclusion: { in: %w[00 01 02 03 04 05 06 07 08] }

      # 00 - Desconhecido (tipo não informado na nota de origem)
      # 01 - Nenhum
      # 02 - Adm. Pública e Repr. Internacional
      # 03 - Alugueis e Arrend. Mercantil de maquinas, equip., embarc. e aeronaves
      # 04 - Arrendamento Mercantil de aeronave para empresa de transporte aéreo público
      # 05 - Comissão a agentes externos na exportação
      # 06 - Despesas de armazenagem, mov. e transporte de carga no exterior
      # 07 - Eventos FIFA (subsidiária)
      # 08 - Eventos FIFA
      # 09 - Fretes, arrendamentos de embarcações ou aeronaves e outros
      # 10 - Material Aeronáutico
      # 11 - Promoção de Bens no Exterior
      # 12 - Promoção de Dest. Turísticos Brasileiros
      # 13 - Promoção do Brasil no Exterior
      # 14 - Promoção Serviços no Exterior
      # 15 - RECINE
      # 16 - RECOPA
      # 17 - Registro e Manutenção de marcas, patentes e cultivares
      # 18 - REICOMP
      # 19 - REIDI
      # 20 - REPENEC
      # 21 - REPES
      # 22 - RETAERO
      # 23 - RETID
      # 24 - Royalties, Assistência Técnica, Científica e Assemelhados
      # 25 - Serviços de avaliação da conformidade vinculados aos Acordos da OMC
      # 26 - ZPE
      validates :mecAFComexT,
                inclusion: { in: %w[00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26] }

      # 0 - Desconhecido (tipo não informado na nota de origem)
      # 1 - Não
      # 2 - Vinculada - Declaração de Importação
      # 3 - Vinculada - Declaração de Exportação
      validates :movTempBens, inclusion: { in: [0, 1, 2, 3] }

      # 0 - Não enviar para o MDIC
      # 1 - Enviar para o MDIC
      validates :mdic, inclusion: { in: [0, 1] }
    end
  end
end
