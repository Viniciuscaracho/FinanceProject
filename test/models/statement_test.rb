# == Schema Information
#
# Table name: statements
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  ends_at         :date
#  starts_at       :date
#  type_cd         :integer          not null
#  workflow_state  :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  bank_account_id :bigint           not null
#
# Indexes
#
#  index_statements_on_account_id       (account_id)
#  index_statements_on_bank_account_id  (bank_account_id)
#  index_statements_on_discarded_at     (discarded_at)
#  index_statements_on_type_cd          (type_cd)
#  index_statements_on_workflow_state   (workflow_state)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (bank_account_id => bank_accounts.id)
#
require "test_helper"

class StatementTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
