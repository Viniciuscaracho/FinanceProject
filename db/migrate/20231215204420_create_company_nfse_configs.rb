class CreateCompanyNfseConfigs < ActiveRecord::Migration[7.0]
  def change
    create_table :company_nfse_configs do |t|
      t.references :company, null: false, foreign_key: { to_table: :people }, comment: 'Empresa / Company'

      t.boolean :enabled, null: false, default: false, comment: 'NFS-e habilitada?'
      t.string  :provider, null: false, default: 'padrao', comment: 'Identificação do provedor para transmissão da DPS: - "padrao": Provedor padrão da prefeitura; "nacional": Ambiente de Dados Nacional (ADN) do Sistema Nacional NFS-e'
      t.string  :environment, null: false, default: 'homologacao', comment: 'Ambiente de emissão da NFSe'

      t.integer :simplified_tax_system_cd, null: false, default: 1, comment: 'Situação perante o Simples Nacional: 1 - Não optante; 2 - Optante (MEI); 3 - Optante (ME/EPP)'
      t.integer :tax_calculation_regime_cd, comment: 'Regime de apuração dos tributos: Opção para que o contribuinte optante pelo Simples Nacional ME/EPP (opSimpNac = 3) possa indicar, ao emitir o documento fiscal, em qual regime de apuração os tributos federais e municipal estão inseridos'
      t.integer :special_tax_regime_cd, null: false, default: 0, comment: 'Regime especial de tributação'
      t.integer :rps_initial_batch_number, comment: 'Número do Lote de RPS. Informe o próximo número do lote RPS a ser utilizado.'
      t.string  :rps_series, comment: 'Série do RPS. A série dos RPS varia de acordo com cada prefeitura, podendo ser número (1, 2 ou 3, por exemplo) ou letras (A, S, NFS, por exemplo)'
      t.integer :rps_initial_number, comment: 'Número do RPS. Informe o próximo número de RPS a ser utilizado'
      t.string  :provider_login
      t.string  :provider_senha
      t.string  :provider_token
      t.boolean :tax_incentive, null: false, default: false, comment: 'Indicador se a empresa possui algum tipo de incentivo fiscal.'

      t.string  :a1_cert_password, comment: 'Senha do Certificado Digital A1'

      t.timestamps
    end
  end
end
