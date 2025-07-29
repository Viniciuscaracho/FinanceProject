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
class CostCenter < Domain
  audited except: %i[tsv_body], associated_with: :account

  acts_as_tenant :account, counter_cache: true
  has_many :transactions, dependent: :restrict_with_error

  after_update_commit do
    publish 'cost_center_updated', record: self
  end

  after_create_commit do
    publish 'cost_center_created', record: self
  end

  after_destroy_commit do
    publish 'cost_center_destroyed', record: self
  end

  def event_name
    return 'cost_center_deleted' if discarded?

    'cost_center_updated'
  end

  def discard_or_destroy!
    if transactions.exists?
      discard
    else
      destroy!
    end
  end
end

