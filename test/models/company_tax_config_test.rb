# == Schema Information
#
# Table name: company_tax_configs
#
#  id                                                                                                                                                           :bigint           not null, primary key
#  ambiente(Ambiente de emissão da NFSe)                                                                                                                        :string           default("homologacao"), not null
#  incentivo_fiscal(Indicador se a empresa possui algum tipo de incentivo fiscal.)                                                                              :boolean          default(FALSE), not null
#  nfse_enabled(NFS-e habilitada)                                                                                                                               :integer          default(0), not null
#  prefeitura_login                                                                                                                                             :string
#  prefeitura_senha                                                                                                                                             :string
#  prefeitura_token                                                                                                                                             :string
#  regime_apuracao_tributo_cd(Regime de apuração do tributo)                                                                                                    :integer          not null
#  regime_especial_tributacao_cd(Regime especial de tributação)                                                                                                 :integer          default(0), not null
#  rps_lote(Número do Lote de RPS. Informe o próximo número do lote RPS a ser utilizado.)                                                                       :integer          default(1), not null
#  rps_numero(Número do RPS. Informe o próximo número de RPS a ser utilizado)                                                                                   :integer          default(1), not null
#  rps_serie(Série do RPS. A série dos RPS varia de acordo com cada prefeitura, podendo ser número (1, 2 ou 3, por exemplo) ou letras (A, S, NFS, por exemplo)) :string           not null
#  simples_nacional_cd(Regime tributário do Simples Nacional)                                                                                                   :integer          default(1), not null
#  created_at                                                                                                                                                   :datetime         not null
#  updated_at                                                                                                                                                   :datetime         not null
#  company_id(Empresa / Company)                                                                                                                                :bigint           not null
#
# Indexes
#
#  index_company_tax_configs_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => people.id)
#
require "test_helper"

class CompanyTaxConfigTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
