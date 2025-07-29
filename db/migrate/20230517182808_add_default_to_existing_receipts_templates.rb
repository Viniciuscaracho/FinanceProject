class AddDefaultToExistingReceiptsTemplates < ActiveRecord::Migration[7.0]
  def up
    ReceiptTemplate.where(name: ["Recebimento Padrão", "Despesa Padrão", "Recibo de Adiantamento de Salário"]).update_all default: true
  end

  def down
    ReceiptTemplate.where(name: ["Recebimento Padrão", "Despesa Padrão", "Recibo de Adiantamento de Salário"]).update_all default: false
  end
end
