# == Schema Information
#
# Table name: service_tax_configs
#
#  id                                                                                                                                                                                                   :bigint           not null, primary key
#  codigo_cidade_prestacao(Código IBGE do município onde o serviço é prestado)                                                                                                                          :string
#  codigo_cnae(Código de CNAE do serviço)                                                                                                                                                               :string
#  codigo_cst(Código de Situação Tributária do PIS/COFINS)                                                                                                                                              :string           default("00"), not null
#  codigo_nbs(Código NBS do serviço (somente NFSE Nacional))                                                                                                                                            :string
#  codigo_pais_prestacao(Código IBGE do município onde o serviço é prestado)                                                                                                                            :string
#  codigo_tributacao_municipio(Código de tributação municipal do ISSQN.)                                                                                                                                :string
#  codigo_tributacao_nacional(Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona) :string
#  iss_aliquota(Alíquota do ISS)                                                                                                                                                                        :decimal(, )      default(0.0), not null
#  iss_codigo_cidade_incidencia(Código do município de incidência do ISSQN (tabela do IBGE))                                                                                                            :string
#  iss_codigo_pais(Código do país onde se verficou o resultado da prestação do serviço para o caso de Exportação de Serviços)                                                                           :string
#  iss_tipo_imunidade_cd(Tipo de imunidade do ISS)                                                                                                                                                      :integer
#  iss_tipo_retencao_cd(Tipo de retenção do ISS)                                                                                                                                                        :integer          default(1), not null
#  iss_tributacao_cd(Tributação do ISSQN sobre o serviço prestado)                                                                                                                                      :integer          not null
#  retencao_cofins_aliquota(Alíquota de retenção do COFINS)                                                                                                                                             :decimal(, )      default(0.0), not null
#  retencao_cpp_aliquota(Alíquota de retenção do CPP)                                                                                                                                                   :decimal(, )      default(0.0), not null
#  retencao_csll_aliquota(Alíquota de retenção do CSLL)                                                                                                                                                 :decimal(, )      default(0.0), not null
#  retencao_inss_aliquota(Alíquota de retenção do INSS)                                                                                                                                                 :decimal(, )      default(0.0), not null
#  retencao_irrf_aliquota(Alíquota de retenção do IRRF)                                                                                                                                                 :decimal(, )      default(0.0), not null
#  retencao_outras(Alíquota de retenção de outras contribuições)                                                                                                                                        :decimal(, )      default(0.0), not null
#  retencao_pis_aliquota(Alíquota de retenção do PIS)                                                                                                                                                   :decimal(, )      default(0.0), not null
#  created_at                                                                                                                                                                                           :datetime         not null
#  updated_at                                                                                                                                                                                           :datetime         not null
#  service_id(Serviço)                                                                                                                                                                                  :bigint           not null
#
# Indexes
#
#  index_service_tax_configs_on_service_id  (service_id)
#
# Foreign Keys
#
#  fk_rails_...  (service_id => offers.id)
#
require "test_helper"

class ServiceTaxConfigTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
