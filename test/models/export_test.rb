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
require "test_helper"

class ExportTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
