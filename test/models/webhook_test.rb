# == Schema Information
#
# Table name: webhooks
#
#  id            :bigint           not null, primary key
#  last_response :integer
#  last_used_at  :datetime
#  url           :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#
# Indexes
#
#  index_webhooks_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class WebhookTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
