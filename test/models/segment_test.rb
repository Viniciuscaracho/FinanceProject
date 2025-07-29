# == Schema Information
#
# Table name: segments
#
#  id                  :bigint           not null, primary key
#  description         :text
#  discarded_at        :datetime
#  language            :string           default("pt-BR"), not null
#  name                :string           not null
#  transaction_type_cd :integer
#  type                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  parent_id           :bigint
#
# Indexes
#
#  index_segments_on_discarded_at         (discarded_at)
#  index_segments_on_language             (language)
#  index_segments_on_parent_id            (parent_id)
#  index_segments_on_transaction_type_cd  (transaction_type_cd)
#  index_segments_on_type                 (type)
#
# Foreign Keys
#
#  fk_rails_...  (parent_id => segments.id)
#
require "test_helper"

class SegmentTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
