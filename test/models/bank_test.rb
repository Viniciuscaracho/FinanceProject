# == Schema Information
#
# Table name: banks
#
#  id          :bigint           not null, primary key
#  code        :integer          not null
#  country     :string           not null
#  description :text
#  ispb        :string
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_banks_on_country_and_code  (country,code) UNIQUE
#
require "test_helper"

class BankTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
