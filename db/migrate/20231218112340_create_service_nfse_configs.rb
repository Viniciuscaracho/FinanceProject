class CreateServiceNfseConfigs < ActiveRecord::Migration[7.0]
  def change
    create_table :service_nfse_configs do |t|
      t.references :service, null: false, foreign_key: { to_table: :offers }, comment: 'Serviço relacionado a configuração'

      t.string :cnae_code, comment: 'Código CNAE do serviço'
      t.string :national_tax_code, comment: 'Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona'
      t.string :municipal_tax_code, comment: 'Código de tributação municipal do ISSQN.'
      t.string :nbs_code, comment: 'Código NBS do serviço (somente NFSE Nacional)'
      t.string :city_code, comment: 'Código IBGE da cidade de prestação do serviço'
      t.string :country_code, comment: 'Código ISO do país de prestação do serviço'

      # ISS
      t.integer :iss_service_provided_tax_cd, comment: 'Tributação do ISSQN sobre o serviço prestado'
      t.string  :iss_country_code, comment: 'País resultado da prestação do serviço'
      t.string  :iss_city_code, comment: 'Município de incidência do ISSQN'
      t.integer :iss_immunity_type_cd, comment: 'Tipo de imunidade do ISS'
      t.integer :iss_withholding_type_cd, comment: 'Tipo de retenção do ISS'
      t.decimal :iss_tax_rate, comment: 'Alíquota do ISS'

      # PIS/COFINS
      t.string  :cst_code, comment: 'Código de Situação Tributária do PIS/COFINS'
      t.integer :pis_cofins_withholding_type_cd, comment: 'Tipo de retencao do Pis/Cofins: 1 - retido; 2 - não retido'
      t.decimal :pis_tax_rate, comment: 'Alíquota de retenção do PIS'
      t.decimal :cofins_tax_rate, comment: 'Alíquota de retenção do COFINS'

      t.timestamps
    end
  end
end
