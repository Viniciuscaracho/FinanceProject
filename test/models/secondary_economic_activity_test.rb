# == Schema Information
#
# Table name: secondary_economic_activities
#
#  id                   :bigint           not null, primary key
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  economic_activity_id :bigint           not null
#  person_id            :bigint           not null
#
# Indexes
#
#  index_secondary_economic_activities_on_economic_activity_id  (economic_activity_id)
#  index_secondary_economic_activities_on_person_id             (person_id)
#  index_secondary_economic_activities_on_unique                (person_id,economic_activity_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (economic_activity_id => enums.id)
#  fk_rails_...  (person_id => people.id)
#
require "test_helper"

class SecondaryEconomicActivityTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
