class AddCompositeIndexesForPerformance < ActiveRecord::Migration[7.0]
  def change
    # Índice composto para queries de available_slots (account_id + account_user_id + status + start_time)
    # Isso otimiza a query que busca agendamentos conflitantes
    add_index :appointments, [:account_id, :account_user_id, :status, :start_time], 
              name: 'index_appointments_on_account_professional_status_time'
    
    # Índice composto para queries de appointments por data e status
    add_index :appointments, [:account_id, :start_time, :status], 
              name: 'index_appointments_on_account_time_status'
    
    # Índice para queries de transactions por account e data
    add_index :transactions, [:account_id, :due_date], 
              name: 'index_transactions_on_account_due_date'
    
    # Índice para queries de transactions por account e paid
    add_index :transactions, [:account_id, :paid], 
              name: 'index_transactions_on_account_paid'
    
    # Índice composto para appointment_links (token + active) - já existe unique em token, mas adicionamos composto
    # Isso já está coberto pelo índice único em token, mas vamos adicionar um índice parcial para active=true
    add_index :appointment_links, [:token, :active], 
              name: 'index_appointment_links_on_token_and_active',
              where: 'active = true'
  end
end
