# frozen_string_literal: true

# == Schema Information
#
# Table name: relationship_stores
#
#  id                   :bigint           not null, primary key
#  direction_cd         :integer          default(0)
#  endpoint             :string
#  external_entity      :string
#  extras               :jsonb
#  internal_entity      :string
#  raw_data             :jsonb
#  source_last_update   :datetime
#  sync_type_cd         :integer          not null
#  synced_at            :datetime
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint
#  external_id          :string
#  integration_store_id :bigint           not null
#  internal_id          :bigint
#  parent_id            :bigint
#  synced_by_id         :bigint
#
# Indexes
#
#  index_relationship_stores_on_account_id                       (account_id)
#  index_relationship_stores_on_external_entity_and_external_id  (external_entity,external_id)
#  index_relationship_stores_on_integration_store_id             (integration_store_id)
#  index_relationship_stores_on_internal_entity_and_internal_id  (internal_entity,internal_id)
#  index_relationship_stores_on_parent_id                        (parent_id)
#  index_relationship_stores_on_sync_type_cd                     (sync_type_cd)
#  index_relationship_stores_on_synced_by_id                     (synced_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (integration_store_id => integration_stores.id)
#  fk_rails_...  (synced_by_id => users.id)
#
class RelationshipStore < ApplicationRecord
  include Integrations::OutboundFeatures

  belongs_to :integration_store
  belongs_to :account, optional: true
  belongs_to :synced_by, class_name: 'User', optional: true

  belongs_to :tied_to, class_name: 'RelationshipStore', foreign_key: :parent_id, optional: true
  has_many :children, class_name: 'RelationshipStore', foreign_key: :parent_id

  # validates when sync type is manual sync that synced_by is present
  validates :synced_by, presence: true, if: -> { sync_type_cd == RelationshipStore::SYNC_TYPES[:manual_sync] }

  # validates when direction is outbound that internal_entity and internal_id are required
  validates :internal_entity, presence: true, if: :outbound_relationship?
  validates :internal_id, presence: true, if: :outbound_relationship?

  # validates when direction is inbound that external_entity and external_id are required
  validates :external_entity, presence: true, if: :inbound_relationship?
  validates :external_id, presence: true, if: :inbound_relationship?

  after_create_commit do
    publish('relationship_store_created', record: self)
  end

  after_update_commit do
    publish('relationship_store_updated', record: self)
  end

  after_destroy_commit do
    publish('relationship_store_deleted', record: self)
  end

  SYNC_TYPES = {
    auto_sync: 0,
    initial_sync: 1,
    manual_sync: 2,
    webhook_sync: 3
  }.freeze

  enum sync_type: SYNC_TYPES

  DIRECTION_TYPES = {
    inbound: 0,
    outbound: 1
  }.freeze

  enum direction: DIRECTION_TYPES

  # since raw_data is a jsonb field, we need to cast it to a hash and return with indifferent access
  # so we can access it with string or symbol keys. i.e. raw_data[:id] or raw_data['id']
  def raw_data
    super&.with_indifferent_access
  end

  def child_relationships
    RelationshipStore.where(parent_id: id)
  end

  def outbound_relationship?
    direction_cd == RelationshipStore::DIRECTION_TYPES[:outbound]
  end

  def inbound_relationship?
    direction_cd == RelationshipStore::DIRECTION_TYPES[:inbound]
  end
end
