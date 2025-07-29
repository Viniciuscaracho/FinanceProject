# frozen_string_literal: true

module Integrations
  module Invoiceable
    extend ActiveSupport::Concern

    included do
      has_one_attached :nfse_pdf
      has_one_attached :nfse_xml
    end

    def referencia
      raise NotImplementedError, 'Method referencia not implemented'
    end

    def download_nfse_pdf
      raise NotImplementedError, 'Method download_pdf not implemented'
    end

    def dto
      raise NotImplementedError, 'Method dto not implemented'
    end

    def able_to_send_nfse?
      raise NotImplementedError, 'Method able_to_send_nfse? not implemented'
    end

    def invoiced?
      raise NotImplementedError, 'Method invoiced? not implemented'
    end

    # A company that provides a service
    def prestador
      raise NotImplementedError, 'Method prestador not implemented'
    end

    # A person, company or contact that receives a service
    def tomador
      raise NotImplementedError, 'Method tomador not implemented'
    end

    # A date and time when the invoice was issued
    def data_hora_emissao
      raise NotImplementedError, 'Method data_hora_emissao not implemented'
    end

    # A date that represents the competition date
    def data_competencia
      raise NotImplementedError, 'Method data_competencia not implemented'
    end

    def valor_servico
      raise NotImplementedError, 'Method valor_servico not implemented'
    end

    def descricao_servico
      raise NotImplementedError, 'Method descricao_servico not implemented'
    end

    def tributacao_issqn
      raise NotImplementedError, 'Method tributacao_issqn not implemented'
    end

    def aliquota
      raise NotImplementedError, 'Method aliquota not implemented'
    end

    def tipo_retencao_issqn
      raise NotImplementedError, 'Method tipo_retencao_issqn not implemented'
    end
  end
end
