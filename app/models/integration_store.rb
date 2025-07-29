# == Schema Information
#
# Table name: integration_stores
#
#  id            :bigint           not null, primary key
#  description   :text
#  integrated_at :datetime
#  name          :string           not null
#  state         :string
#  store_type_cd :integer          not null
#  type          :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint
#  parent_id     :bigint
#
# Indexes
#
#  idx_integrations_stores_uniq            (type,store_type_cd,account_id) UNIQUE
#  index_integration_stores_on_account_id  (account_id)
#  index_integration_stores_on_parent_id   (parent_id)
#  index_integration_stores_on_state       (state)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class IntegrationStore < ApplicationRecord
  include Integrations::Helpers

  STORE_TYPES = {
    open_banking: 0,
    invoicing: 1
  }.freeze

  as_enum :store_type, STORE_TYPES

  scope :globals, -> { where(account_id: nil) }

  belongs_to :account, optional: true

  # belongs_to :parent_store, class_name: 'IntegrationStore', foreign_key: :parent_id, optional: true
  has_many :relationship_stores, dependent: :delete_all

  after_create_commit do
    publish('integration_store_created', record: self)
  end

  after_update_commit do
    publish('integration_store_updated', record: self)
  end

  after_destroy_commit do
    publish('integration_store_deleted', record: self)
  end

  has_settings do |s|
    s.key :config, defaults: {
      development: {
        api_key: 'api_key',
        host: 'https://api.host.com',
        allowed_hosts: %w[127.0.0.1 localhost]
      },
      staging: {
        api_key: 'api_key',
        host: 'https://api.host.com',
        allowed_hosts: %w[127.0.0.1 localhost]
      },
      production: {
        api_key: 'api_key',
        host: 'https://api.host.com',
        allowed_hosts: %w[127.0.0.1 localhost]
      }
    }
    s.key :endpoints, defaults: {
      endpoint_name: {
        method: Net::HTTP::Post::METHOD,
        uri: '/api/method/{{id}}'
      }
    }
  end

  def integrated?
    raise NotImplementedError, 'You must implement the integrated? method'
  end
end
