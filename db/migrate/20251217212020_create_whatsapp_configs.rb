class CreateWhatsappConfigs < ActiveRecord::Migration[7.0]
  def change
    create_table :whatsapp_configs do |t|
      t.references :account, null: false, foreign_key: true, index: { unique: true }
      t.string :evolution_api_url
      t.string :evolution_api_key
      t.string :evolution_instance_name, default: 'default'
      t.boolean :enabled, default: false

      t.timestamps
    end
  end
end
