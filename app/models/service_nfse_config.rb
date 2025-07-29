# frozen_string_literal: true

# == Schema Information
#
# Table name: service_nfse_configs
#
#  id                                                                                                                                                                                          :bigint           not null, primary key
#  city_code(Código IBGE da cidade de prestação do serviço)                                                                                                                                    :string
#  cnae_code(Código CNAE do serviço)                                                                                                                                                           :string
#  cofins_tax_rate(Alíquota de retenção do COFINS)                                                                                                                                             :decimal(, )
#  country_code(Código ISO do país de prestação do serviço)                                                                                                                                    :string
#  cst_code(Código de Situação Tributária do PIS/COFINS)                                                                                                                                       :string
#  iss_city_code(Município de incidência do ISSQN)                                                                                                                                             :string
#  iss_country_code(País resultado da prestação do serviço)                                                                                                                                    :string
#  iss_immunity_type_cd(Tipo de imunidade do ISS)                                                                                                                                              :integer
#  iss_service_provided_tax_cd(Tributação do ISSQN sobre o serviço prestado)                                                                                                                   :integer
#  iss_tax_rate(Alíquota do ISS)                                                                                                                                                               :decimal(, )
#  iss_withholding_type_cd(Tipo de retenção do ISS)                                                                                                                                            :integer
#  municipal_tax_code(Código de tributação municipal do ISSQN.)                                                                                                                                :string
#  national_tax_code(Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona) :string
#  nbs_code(Código NBS do serviço (somente NFSE Nacional))                                                                                                                                     :string
#  pis_cofins_withholding_type_cd(Tipo de retencao do Pis/Cofins: 1 - retido; 2 - não retido)                                                                                                  :integer
#  pis_tax_rate(Alíquota de retenção do PIS)                                                                                                                                                   :decimal(, )
#  created_at                                                                                                                                                                                  :datetime         not null
#  updated_at                                                                                                                                                                                  :datetime         not null
#  service_id(Serviço relacionado a configuração)                                                                                                                                              :bigint           not null
#
# Indexes
#
#  index_service_nfse_configs_on_service_id  (service_id)
#
# Foreign Keys
#
#  fk_rails_...  (service_id => offers.id)
#
class ServiceNfseConfig < ApplicationRecord
  # iss_service_provided_tax
  ISS_SERVICE_PROVIDED_TAX_TYPES = {
    operacao_tributavel: 1,
    imunidade: 2,
    exportacao_de_servico: 3,
    nao_incidencia: 4
  }.freeze

  ISS_IMMUNITY_TYPES = {
    imunidade: 0,
    patrimonio_renda_servicos_uns_dos_outros: 1,
    templos: 2,
    patrimonio_renda_servicos_partidos_politicos: 3,
    livros_jornais_periodicos: 4
  }.freeze

  ISS_WITHHOLDING_TYPES = {
    nao_retido: 1,
    retido_pelo_tomador: 2,
    retido_pelo_intermediario: 3
  }.freeze

  CST_CODES = {
    nenhum: '00',
    operacao_tributavel_com_aliquota_basica: '01',
    operacao_tributavel_com_aliquota_diferenciada: '02',
    operacao_tributavel_com_aliquota_por_unidade_de_medida_de_produto: '03',
    operacao_tributavel_monofasica_aliquota_zero: '04',
    operacao_tributavel_com_substituicao_tributaria: '05',
    operacao_tributavel_com_aliquota_zero: '06',
    operacao_tributavel_da_contribuicao: '07',
    operacao_sem_incidencia_da_contribuicao: '08',
    operacao_com_suspensao_da_contribuicao: '09'
  }.freeze

  PIS_COFINS_WITHHOLDING_TYPES = {
    nao_retido: 1,
    retido: 2
  }.freeze

  as_enum :iss_service_provided_tax, ISS_SERVICE_PROVIDED_TAX_TYPES, pluralize_scopes: false
  as_enum :iss_immunity_type, ISS_IMMUNITY_TYPES, pluralize_scopes: false
  as_enum :iss_withholding_type, ISS_WITHHOLDING_TYPES, pluralize_scopes: false
  as_enum :cst_code, CST_CODES, pluralize_scopes: false, map: :string, source: :cst_code
  as_enum :pis_cofins_withholding_type, PIS_COFINS_WITHHOLDING_TYPES, pluralize_scopes: false

  # validates :national_tax_code,
  #           allow_blank: true,
  #           inclusion: { in: -> { NationalServiceCode.where(key: _1.national_tax_code).pluck(:key) } },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :nbs_code,
  #           allow_blank: true,
  #           inclusion: { in: -> { NbsCode.where(key: _1.nbs_code).pluck(:key) }},
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :city_code,
  #           allow_blank: true,
  #           inclusion: { in: -> { City.where(key: _1.city_code).pluck(:key) } },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :country_code,
  #           allow_blank: true,
  #           inclusion: { in: CS.countries.keys.map(&:to_s) },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_service_provided_tax_cd,
  #           allow_blank: true,
  #           inclusion: { in: ISS_SERVICE_PROVIDED_TAX_TYPES.values },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_immunity_type_cd,
  #           allow_blank: true,
  #           inclusion: { in: ISS_IMMUNITY_TYPES.values },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_immunity_type_cd,
  #           presence: true,
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) && immunity? }

  # validates :iss_withholding_type_cd,
  #           allow_blank: true,
  #           inclusion: { in: ISS_WITHHOLDING_TYPES.values },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :cnae_code,
  #           allow_blank: true,
  #           inclusion: { in: -> { _1.service.account.company.cnaes.pluck(:key) } },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_city_code,
  #           allow_blank: true,
  #           inclusion: { in: -> { City.where(key: _1.iss_city_code).pluck(:key) } },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_country_code,
  #           allow_blank: true,
  #           inclusion: { in: CS.countries.keys.map(&:to_s) },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :iss_country_code,
  #           presence: true,
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) && service_export? }

  # validates :cst_code,
  #           allow_blank: true,
  #           inclusion: { in: CST_CODES.values },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  # validates :pis_cofins_withholding_type_cd,
  #           allow_blank: true,
  #           inclusion: { in: PIS_COFINS_WITHHOLDING_TYPES.values },
  #           if: -> { Flipper.enabled?(:nfse, _1.service.account) }

  belongs_to :service

  after_initialize :set_default_country

  def city
    City.find_by(key: city_code)
  end

  def iss_city
    City.find_by(key: iss_city_code)
  end

  private

  def set_default_country
    self.country_code     = 'BR' if country_code.blank?
    self.iss_country_code = 'BR' if iss_country_code.blank?
  end

  def service_export?
    iss_service_provided_tax_cd == ISS_SERVICE_PROVIDED_TAX_TYPES[:exportacao_de_servico]
  end

  def immunity?
    iss_service_provided_tax_cd == ISS_SERVICE_PROVIDED_TAX_TYPES[:imunidade]
  end
end
