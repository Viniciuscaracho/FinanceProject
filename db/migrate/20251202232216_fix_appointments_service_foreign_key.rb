class FixAppointmentsServiceForeignKey < ActiveRecord::Migration[7.0]
  def up
    # Remove a foreign key incorreta que aponta para 'services'
    remove_foreign_key :appointments, :services if foreign_key_exists?(:appointments, :services)
    
    # Adiciona a foreign key correta que aponta para 'offers'
    add_foreign_key :appointments, :offers, column: :service_id
  end

  def down
    remove_foreign_key :appointments, :offers if foreign_key_exists?(:appointments, :offers, column: :service_id)
    add_foreign_key :appointments, :services, column: :service_id
  end
end
