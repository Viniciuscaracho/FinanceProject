class AddCnaeToPeople < ActiveRecord::Migration[7.0]
  def change
    add_reference :people, :cnae, null: true, foreign_key: { to_table: :enums }

    add_column :people, :document_3, :string, comment: 'Inscrição Municial (PJ) / CNH (PF)'
    add_column :people, :cert_password, :string, if_not_exists: true, comment: 'Senha do Certificado Digital'
    add_column :people, :screen_name, :string, if_not_exists: true, comment: 'Nome fantasia para PJ / Nome social para PF'
  end
end
