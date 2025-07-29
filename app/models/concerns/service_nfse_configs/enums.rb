# frozen_string_literal: true

module ServiceNfseConfigs
  module Enums
    extend ActiveSupport::Concern

    ISS_TRUBUTACAO_SERVICOS = {
      operacao_tributavel: 1,
      imunidade: 2,
      exportacao_de_servico: 3,
      nao_incidencia: 4
    }.freeze

    ISS_TIPOS_DE_IMUNIDADE = {
      imunidade: 0,
      patrimonio_renda_servicos_uns_dos_outros: 1,
      templos: 2,
      patrimonio_renda_servicos_partidos_politicos: 3,
      livros_jornais_periodicos: 4
    }.freeze

    ISS_TIPOS_DE_RETENCAO = {
      nao_retido: 1,
      retido_pelo_tomador: 2,
      retido_pelo_intermediario: 3
    }.freeze

    CODIGOS_CST = {
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

    TIPOS_DE_RETENCAO_PIS_COFINS = {
      nao_retido: 1,
      retido: 2
    }.freeze


    included do
      as_enum :iss_service_provided_tax, ISS_TRUBUTACAO_SERVICOS, pluralize_scopes: false
      as_enum :iss_immunity_type, ISS_TIPOS_DE_IMUNIDADE, pluralize_scopes: false
      as_enum :iss_tipo_retencao, ISS_TIPOS_DE_RETENCAO, pluralize_scopes: false
      as_enum :codigo_cst, CODIGOS_CST, pluralize_scopes: false, map: :string, source: :codigo_cst
      as_enum :tipo_retencao_pis_cofins, TIPOS_DE_RETENCAO_PIS_COFINS, pluralize_scopes: false
    end
  end
end
