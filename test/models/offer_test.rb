# == Schema Information
#
# Table name: offers
#
#  id                  :bigint           not null, primary key
#  cost_price_cents    :bigint           default(0), not null
#  currency            :string           default("BRL"), not null
#  data                :jsonb            not null
#  description         :text
#  discarded_at        :datetime
#  enabled             :string           default("t"), not null
#  internal_code       :string
#  metadata            :jsonb            not null
#  name                :string           not null
#  offer_type_cd       :integer
#  selling_price_cents :bigint           default(0), not null
#  type                :string           not null
#  unit                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#
# Indexes
#
#  index_offers_on_account_id                            (account_id)
#  index_offers_on_account_id_and_discarded_at           (account_id,discarded_at)
#  index_offers_on_account_id_and_enabled                (account_id,enabled)
#  index_offers_on_account_id_and_internal_code          (account_id,internal_code)
#  index_offers_on_account_id_and_type                   (account_id,type)
#  index_offers_on_discarded_at_and_type_and_account_id  (discarded_at,type,account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class OfferTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
