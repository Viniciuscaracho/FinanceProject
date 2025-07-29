# frozen_string_literal: true

module ServiceNfseConfigs
  module Validators
    extend ActiveSupport::Concern

    included do
      validates :codigo_tributacao_nacional,
                allow_blank: true,
                inclusion: { in: NationalServiceCode.pluck(:key) }

      validates :codigo_nbs,
                allow_blank: true,
                inclusion: { in: NbsCode.pluck(:key) }

      validates :codigo_cidade_prestacao,
                allow_blank: true,
                inclusion: { in: City.pluck(:key) }

      validates :codigo_pais_prestacao,
                allow_blank: true,
                inclusion: { in: CS.countries.keys.map(&:to_s) }

      validates :iss_tributacao_servico_cd,
                allow_blank: true,
                inclusion: { in: ServiceNfseConfigs::Enums::ISS_TRUBUTACAO_SERVICOS.values }

      validates :iss_tipo_imunidade_cd,
                allow_blank: true,
                inclusion: { in: ServiceNfseConfigs::Enums::ISS_TIPOS_DE_IMUNIDADE.values }

      validates :iss_tipo_imunidade_cd,
                presence: true,
                if: lambda {
                  iss_tributacao_servico_cd == ServiceNfseConfigs::Enums::ISS_TRUBUTACAO_SERVICOS[:imunidade]
                }

      validates :iss_tipo_retencao_cd,
                allow_blank: true,
                inclusion: { in: ServiceNfseConfigs::Enums::ISS_TIPOS_DE_RETENCAO.values }

      validates :codigo_cnae,
                allow_blank: true,
                inclusion: { in: Current.account.company.cnaes.pluck(:key) }

      validates :iss_codigo_pais_resultado,
                allow_blank: true,
                inclusion: { in: CS.countries.keys.map(&:to_s) }

      validates :iss_codigo_pais_resultado,
                presence: true,
                if: lambda {
                  iss_tributacao_servico_cd == ServiceNfseConfigs::Enums::ISS_TRUBUTACAO_SERVICOS[:exportacao_de_servico]
                }
    end
  end
end
