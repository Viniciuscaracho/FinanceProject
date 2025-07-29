# frozen_string_literal: true

# == Schema Information
#
# Table name: company_nfse_configs
#
#  id                                                                                                                                                                                                                                                                      :bigint           not null, primary key
#  a1_cert_password(Senha do Certificado Digital A1)                                                                                                                                                                                                                       :string
#  enabled(NFS-e habilitada?)                                                                                                                                                                                                                                              :boolean          default(FALSE), not null
#  environment(Ambiente de emissão da NFSe)                                                                                                                                                                                                                                :string           default("homologacao"), not null
#  provider(Identificação do provedor para transmissão da DPS: - "padrao": Provedor padrão da prefeitura; "nacional": Ambiente de Dados Nacional (ADN) do Sistema Nacional NFS-e)                                                                                          :string           default("padrao"), not null
#  provider_login                                                                                                                                                                                                                                                          :string
#  provider_senha                                                                                                                                                                                                                                                          :string
#  provider_token                                                                                                                                                                                                                                                          :string
#  rps_initial_batch_number(Número do Lote de RPS. Informe o próximo número do lote RPS a ser utilizado.)                                                                                                                                                                  :integer
#  rps_initial_number(Número do RPS. Informe o próximo número de RPS a ser utilizado)                                                                                                                                                                                      :integer
#  rps_series(Série do RPS. A série dos RPS varia de acordo com cada prefeitura, podendo ser número (1, 2 ou 3, por exemplo) ou letras (A, S, NFS, por exemplo))                                                                                                           :string
#  simplified_tax_system_cd(Situação perante o Simples Nacional: 1 - Não optante; 2 - Optante (MEI); 3 - Optante (ME/EPP))                                                                                                                                                 :integer          default(1), not null
#  special_tax_regime_cd(Regime especial de tributação)                                                                                                                                                                                                                    :integer          default(0), not null
#  tax_calculation_regime_cd(Regime de apuração dos tributos: Opção para que o contribuinte optante pelo Simples Nacional ME/EPP (opSimpNac = 3) possa indicar, ao emitir o documento fiscal, em qual regime de apuração os tributos federais e municipal estão inseridos) :integer
#  tax_incentive(Indicador se a empresa possui algum tipo de incentivo fiscal.)                                                                                                                                                                                            :boolean          default(FALSE), not null
#  created_at                                                                                                                                                                                                                                                              :datetime         not null
#  updated_at                                                                                                                                                                                                                                                              :datetime         not null
#  company_id(Empresa / Company)                                                                                                                                                                                                                                           :bigint           not null
#
# Indexes
#
#  index_company_nfse_configs_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => people.id)
#
class CompanyNfseConfig < ApplicationRecord
  SIMPLIFIED_TAX_SYSTEMS = {
    nao_optante: 1,
    mei: 2,
    me_epp: 3
  }.freeze

  TAX_CALCULATION_REGIMES = {
    tributos_federais_e_municipais_pelo_sn: 1,
    tributos_federais_pelo_sn_e_issqn_por_fora_do_sn: 2,
    tributos_federais_e_municipais_por_fora_do_sn: 3
  }.freeze

  SPECIAL_TAX_REGIMES = {
    nenhum: 0,
    cooperativa: 1,
    estimativa: 2,
    microempresa_municipal: 3,
    notario: 4,
    profissional_autonomo: 5,
    socieda_de_profissionais: 6
  }.freeze

  ENVIRONMENTS = %i[homologacao producao].freeze
  PROVIDERS = %i[padrao nacional].freeze

  as_enum :simplified_tax_system, SIMPLIFIED_TAX_SYSTEMS, pluralize_scopes: false
  as_enum :tax_calculation_regime, TAX_CALCULATION_REGIMES, pluralize_scopes: false
  as_enum :special_tax_regime, SPECIAL_TAX_REGIMES, pluralize_scopes: false
  as_enum :environment, ENVIRONMENTS, pluralize_scopes: false, source: :environment, map: :string
  as_enum :provider, PROVIDERS, pluralize_scopes: false, source: :provider, map: :string
  as_enum :iss_service_provided_tax, ServiceNfseConfig::ISS_SERVICE_PROVIDED_TAX_TYPES, pluralize_scopes: false
  as_enum :iss_withholding_type, ServiceNfseConfig::ISS_WITHHOLDING_TYPES, pluralize_scopes: false

  include CompanyNfseConfigs::NuvemFiscal

  encrypts :provider_login, :provider_senha, :provider_token, :a1_cert_password

  belongs_to :company
  has_one_attached :a1_cert_file

  validates :enabled, inclusion: { in: [true, false] }
  validates :tax_incentive, inclusion: { in: [true, false] }

  validates :simplified_tax_system_cd,
            presence: true,
            inclusion: { in: SIMPLIFIED_TAX_SYSTEMS.values },
            if: -> { enabled? }

  validates :tax_calculation_regime_cd,
            presence: true,
            inclusion: { in: TAX_CALCULATION_REGIMES.values },
            if: -> { enabled? && simplified_tax_system_cd == 3 }

  validates :special_tax_regime_cd,
            presence: true,
            inclusion: { in: SPECIAL_TAX_REGIMES.values },
            if: -> { enabled? }

  # RPS Validations
  validates :rps_initial_batch_number,
            presence: true,
            numericality: { greater_than_or_equal_to: 1 },
            if: -> { enabled? }

  validates :rps_series,
            presence: true,
            if: -> { enabled? }

  validates :rps_initial_number,
            presence: true,
            numericality: { greater_than_or_equal_to: 1 },
            if: -> { enabled? }

  # Ambiente Validations
  validates :environment,
            presence: true,
            inclusion: { in: ENVIRONMENTS },
            if: -> { enabled? }

  validates :provider,
            presence: true,
            inclusion: { in: PROVIDERS },
            if: -> { enabled? }

  # Certificado Digital Validations

  # validates :a1_cert_file,     attached: true, if: -> { enabled? }
  # validates :a1_cert_password, presence: true, if: -> { enabled? }

  # ISSQN Validations
  validates :iss_service_provided_tax_cd,
            presence: true,
            if: -> { enabled? }

  validates :iss_withholding_type_cd,
            presence: true,
            if: -> { enabled? }

  validates :national_tax_code,
            presence: true,
            if: -> { enabled? }

  # Callbacks

  after_create_commit do
    # publish('company_nfse_config_enabled',  record: self) if enabled?
    # publish('company_nfse_config_created',  record: self)
  end

  after_update_commit do
    # publish('company_nfse_config_enabled',  record: self) if enabled_previously_changed? && enabled?
    # publish('company_nfse_config_disabled', record: self) if enabled_previously_changed? && !enabled?
    # publish('company_nfse_config_a1_cert_changed', record: self) if a1_cert_password_previously_changed? && enabled?
    # publish('company_nfse_config_updated', record: self)
  end
end
