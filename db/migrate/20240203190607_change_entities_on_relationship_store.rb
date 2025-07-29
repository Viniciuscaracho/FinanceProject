# frozen_string_literal: true

class ChangeEntitiesOnRelationshipStore < ActiveRecord::Migration[7.0]
  def up
    change_column_null :relationship_stores, :external_entity, true
    change_column_null :relationship_stores, :external_id, true
  end

  def down
    change_column_null :relationship_stores, :external_entity, false
    change_column_null :relationship_stores, :external_id, false
  end
end
