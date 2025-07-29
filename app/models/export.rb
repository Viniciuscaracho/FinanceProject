# frozen_string_literal: true

# == Schema Information
#
# Table name: exports
#
#  id              :bigint           not null, primary key
#  params          :jsonb            not null
#  progress_number :bigint
#  progress_total  :bigint
#  source_cd       :integer
#  state_cd        :integer          default(0)
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#
# Indexes
#
#  index_exports_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Export < ApplicationRecord
  include Exports::Constants

  belongs_to :account
  has_one_attached :file

  as_enum :state, EXPORTS_STATES
  as_enum :source, EXPORTS_SOURCES

  after_create_commit :start_export_job
  after_update_commit -> { broadcast_replace_to 'exports' }

  def current_progress
    return 0.0 if progress_number.zero? || progress_total.zero?

    (progress_number.to_f / progress_total * 100)
  end

  def name
    # file.filename.sanitized
  end

  private

  def start_export_job
    ActiveJobHelper.perform_later(ExecuteExportJob, id)
  end
end
