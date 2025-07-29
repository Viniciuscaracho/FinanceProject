# frozen_string_literal: true

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
module IntegrationStores
  class Pluggy < IntegrationStore
    include Integrations::Pluggy

    after_initialize do
      self.name = Integrations::Pluggy::NAME if name.blank?
    end

    belongs_to :parent_store, class_name: 'IntegrationStores::Pluggy', foreign_key: :parent_id, optional: true
    has_many :integration_stores, class_name: 'IntegrationStores::Pluggy', foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent_store
  end
end
