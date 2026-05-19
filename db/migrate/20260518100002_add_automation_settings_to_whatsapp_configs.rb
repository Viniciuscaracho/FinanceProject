# frozen_string_literal: true

class AddAutomationSettingsToWhatsappConfigs < ActiveRecord::Migration[7.0]
  def change
    add_column :whatsapp_configs, :allowed_hours_start, :integer, default: 8,  null: false
    add_column :whatsapp_configs, :allowed_hours_end,   :integer, default: 20, null: false
    add_column :whatsapp_configs, :cooldown_minutes,    :integer, default: 30, null: false
    add_column :whatsapp_configs, :automations, :json, default: {
      appointment_confirmation: true,
      appointment_reminder_24h: true,
      appointment_reminder_1h:  true,
      payment_link:             true,
      payment_confirmed:        true,
      meal_plan_updated:        false,
      form_pending:             false,
      return_reminder:          false
    }
  end
end
