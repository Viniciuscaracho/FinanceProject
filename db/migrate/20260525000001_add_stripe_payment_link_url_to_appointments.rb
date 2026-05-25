# frozen_string_literal: true

class AddStripePaymentLinkUrlToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :stripe_payment_link_url, :string
  end
end
