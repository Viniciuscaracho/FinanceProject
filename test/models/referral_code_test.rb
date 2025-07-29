# == Schema Information
#
# Table name: referral_codes
#
#  id                                                 :bigint           not null, primary key
#  account_type_cd                                    :integer          default(0), not null
#  benefit(Benefit (in percentage))                   :integer          default(0), not null
#  benefit_type_cd(Benefit type)                      :integer          default(0), not null
#  code(Unique referral code)                         :string           not null
#  create_free_personal_account                       :boolean          default(TRUE), not null
#  description(Description of the referral code)      :text
#  discarded_at                                       :datetime
#  name(Name of the referral code)                    :string           not null
#  referrer_type                                      :string
#  trial_days                                         :integer          default(30), not null
#  created_at                                         :datetime         not null
#  updated_at                                         :datetime         not null
#  referrer_id(Referrer that owns this referral code) :bigint
#
# Indexes
#
#  index_referral_codes_on_code          (code) UNIQUE
#  index_referral_codes_on_discarded_at  (discarded_at)
#  index_referral_codes_on_referrer      (referrer_type,referrer_id)
#
require "test_helper"

class ReferralCodeTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
