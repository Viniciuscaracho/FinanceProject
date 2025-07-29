# frozen_string_literal: true

class CreateCompanyEconomicActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :company_economic_activities do |t|
      t.references :company, null: false, foreign_key: { to_table: :people }
      t.references :economic_activity, null: false, foreign_key: { to_table: :enums }
      t.boolean :primary, null: false, default: false

      t.timestamps
    end

    add_index :company_economic_activities, %i[company_id economic_activity_id],
              unique: true,
              name: 'index_company_economic_activities_on_unique'

    add_column :people, :cert_password, :string
  end
end
