# frozen_string_literal: true

class AddOfferTypeCdToOffers < ActiveRecord::Migration[7.0]
  def change
    add_column :offers, :offer_type_cd, :integer
    add_index :offers, %i[discarded_at type account_id]
  end
end
