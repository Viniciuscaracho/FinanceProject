# frozen_string_literal: true

class AddConnectedPhoneToWhatsappConfigs < ActiveRecord::Migration[7.0]
  def change
    add_column :whatsapp_configs, :connected_phone, :string
    add_column :whatsapp_configs, :instance_status, :string, default: 'close'
  end
end
