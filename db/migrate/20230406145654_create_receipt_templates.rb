class CreateReceiptTemplates < ActiveRecord::Migration[7.0]
  def change
    create_table :receipt_templates do |t|

      t.timestamps
    end
  end
end
