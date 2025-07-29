# == Schema Information
#
# Table name: subscription_webhooks
#
#  id         :bigint           not null, primary key
#  details    :jsonb            not null
#  event      :jsonb            not null
#  event_type :string           not null
#  status     :string           default("pending"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require "test_helper"

class SubscriptionWebhookTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
