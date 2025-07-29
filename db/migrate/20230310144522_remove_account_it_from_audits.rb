class RemoveAccountItFromAudits < ActiveRecord::Migration[7.0]
  def change
    remove_reference :audits, :account, null: false, foreign_key: true
  end
end
