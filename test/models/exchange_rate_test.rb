# == Schema Information
#
# Table name: exchange_rates
#
#  id         :bigint           not null, primary key
#  from       :string(3)        not null
#  rate       :decimal(20, 5)   not null
#  to         :string(3)        not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_exchange_rates_on_from_and_to  (from,to)
#
require "test_helper"

class ExchangeRateTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
