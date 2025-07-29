# frozen_string_literal: true

class AddDirectionToRelationshipStores < ActiveRecord::Migration[7.0]
  def change
    add_column :relationship_stores, :direction_cd, :integer, default: 0
  end
end
