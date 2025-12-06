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
require "test_helper"

class ImportTest < ActiveSupport::TestCase
  # setup do
  #   @import = imports(:import_one)
  # end
  #
  # test "should create an import" do
  #   import = Import.new(
  #     account: accounts(:account),
  #     source: :zero_paper,
  #   )
  #   assert_equal "User", import.account.users.name
  #   assert import.zero_paper?
  # end
  #
  # test "should update an import" do
  #   @import.update!(
  #     state: :in_progress,
  #     source: nil,
  #   )
  #   assert @import.in_progress?
  #   assert_not @import.zero_paper?
  # end
  #
  # test "should find an import by ID" do
  #   import = Import.find(@import.id)
  #   assert_equal "User", import.account.users.name
  #   assert_equal "one@barbermanagement.io", import.account.users.first.email
  # end
end
