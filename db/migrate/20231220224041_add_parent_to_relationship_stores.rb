# frozen_string_literal: true

# Adds auto relationship to relationship stores
class AddParentToRelationshipStores < ActiveRecord::Migration[7.0]
  def change
    add_reference :relationship_stores, :parent, null: true
  end
end
