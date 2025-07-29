# == Schema Information
#
# Table name: payment_plans
#
#  id                     :bigint           not null, primary key
#  amount_cents           :bigint           default(0), not null
#  amount_currency        :string(3)        default("BRL"), not null
#  amount_type_cd         :integer          default(0), not null
#  discarded_at           :datetime
#  frequency_cd           :integer          default(3), not null
#  number_of_installments :integer          default(3), not null
#  type_cd                :integer          default(0), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  account_id             :bigint           not null
#
# Indexes
#
#  index_payment_plans_on_account_id              (account_id)
#  index_payment_plans_on_account_id_and_type_cd  (account_id,type_cd)
#  index_payment_plans_on_amount_type_cd          (amount_type_cd)
#  index_payment_plans_on_discarded_at            (discarded_at)
#  index_payment_plans_on_frequency_cd            (frequency_cd)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class PaymentPlanTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
