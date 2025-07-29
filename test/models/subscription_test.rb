# == Schema Information
#
# Table name: subscriptions
#
#  id                   :bigint           not null, primary key
#  cancel_at_period_end :boolean          default(FALSE), not null
#  current_period_end   :datetime         not null
#  current_period_start :datetime         not null
#  data                 :jsonb            not null
#  metadata             :jsonb            not null
#  name                 :string           not null
#  status               :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint           not null
#  processor_id         :string           not null
#  processor_plan_id    :string
#  processor_product_id :string
#
# Indexes
#
#  index_subscriptions_on_account_id                   (account_id)
#  index_subscriptions_on_account_id_and_processor_id  (account_id,processor_id)
#  index_subscriptions_on_processor_id                 (processor_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class SubscriptionTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
