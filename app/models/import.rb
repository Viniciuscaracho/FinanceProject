# == Schema Information
#
# Table name: imports
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  message         :string
#  progress_number :bigint
#  progress_total  :bigint
#  source_cd       :integer
#  state_cd        :integer
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#
# Indexes
#
#  index_imports_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Import < ApplicationRecord
  include Imports::Constants
  as_enum :state, IMPORTS_STATES
  as_enum :source, IMPORTS_SOURCES

  # include Discardable
  include Discard::Model

  acts_as_tenant :account
  audited associated_with: :account

  has_many :transactions, dependent: :delete_all
  has_many :zero_paper_items, dependent: :delete_all

  has_one_attached :file

  after_create_commit :start_import_job
  after_update_commit -> { broadcast_replace_to 'imports' }
  after_destroy :update_balances

  def current_progress
    return 0.0 if progress_number.zero? || progress_total.zero?

    (progress_number.to_f / progress_total * 100)
  end

  def name
    file.filename.sanitized
  end

  def able_to_destroy?
    (created_at > 30.days.ago) && able_to_discard?
  end

  def unable_to_destroy?
    !able_to_destroy?
  end

  def able_to_discard?
    done? || failed?
  end

  def unable_to_discard?
    !able_to_discard?
  end

  private

  def update_balances
    account.bank_accounts.each(&:update_balance!)
    account.update_balance!
  end

  def start_import_job
    ActiveJobHelper.perform_later(ExecuteImportJob, id)
    # ExecuteImportJob.perform_later(id)
  end
end
