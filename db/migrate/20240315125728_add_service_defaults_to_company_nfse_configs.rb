class AddServiceDefaultsToCompanyNfseConfigs < ActiveRecord::Migration[7.0]
  def change
    add_column :company_nfse_configs, :national_tax_code, :string, comment: 'Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona'
    add_column :company_nfse_configs, :municipal_tax_code, :string, comment: 'Código de tributação municipal do ISSQN.'
    add_column :company_nfse_configs, :service_description, :string, comment: 'Descrição padrão do serviço prestado'

    add_column :company_nfse_configs, :iss_service_provided_tax_cd, :integer, comment: 'Tributação do ISSQN sobre o serviço prestado'
    add_column :company_nfse_configs, :iss_withholding_type_cd, :integer, comment: 'Tipo de retenção do ISS'
    add_column :company_nfse_configs, :iss_tax_rate, :decimal, comment: 'Alíquota do ISS'
  end
end
