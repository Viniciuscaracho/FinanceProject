# frozen_string_literal: true

# == Schema Information
#
# Table name: domains
#
#  id                  :bigint           not null, primary key
#  description         :text
#  discarded_at        :datetime
#  name                :string           not null
#  transaction_type_cd :integer
#  type                :string           not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#  created_by_id       :bigint
#  updated_by_id       :bigint
#
# Indexes
#
#  index_domains_on_account_id                                   (account_id)
#  index_domains_on_account_id_and_type_and_discarded_at         (account_id,type,discarded_at)
#  index_domains_on_created_by_id                                (created_by_id)
#  index_domains_on_discarded_at                                 (discarded_at)
#  index_domains_on_discarded_at_and_type_and_account_id_and_id  (discarded_at,type,account_id,id)
#  index_domains_on_id_and_type                                  (id,type)
#  index_domains_on_transaction_type_cd                          (transaction_type_cd)
#  index_domains_on_tsv_body                                     (tsv_body) USING gin
#  index_domains_on_type                                         (type)
#  index_domains_on_updated_by_id                                (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (updated_by_id => users.id)
#
class Domain < ApplicationRecord
  self.ignored_columns = %w[tsv_body]

  include Domains::Searchable
  include Discardable
  include UserChanges

  # validate if name is present and the length is less than 100 characters
  validates :name, length: { maximum: 100 }, presence: true
  # validate if description length is less than 1000 characters
  validates :description, length: { maximum: 1000 }

  def name
    return "#{super} - #{I18n.t('shared.discarded')}" if discarded?

    super
  end

  def event_attributes
    super.slice(:id, :account_id, :name, :updated_at, :discarded_at)
  end
end
