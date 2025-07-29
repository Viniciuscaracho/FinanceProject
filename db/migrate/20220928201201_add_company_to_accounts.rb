# frozen_string_literal: true

class AddCompanyToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_reference :accounts, :company, null: false, foreign_key: { to_table: :people }
  end
end
