# == Schema Information
#
# Table name: enums
#
#  id           :bigint           not null, primary key
#  description  :text
#  discarded_at :datetime
#  key          :string           not null
#  metadata     :jsonb            not null
#  type         :string           not null
#  value        :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  parent_id    :bigint
#
# Indexes
#
#  index_enums_on_parent_id              (parent_id)
#  index_enums_on_type_and_discarded_at  (type,discarded_at)
#  index_enums_on_type_and_key           (type,key) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (parent_id => enums.id)
#
class City < Enum
  store_attribute :metadata, :able_to_emit_nfse, :boolean, default: false

  belongs_to :state, foreign_key: :parent_id, inverse_of: :cities

  scope :able_to_emit_nfses, -> { where('metadata @> ?', { able_to_emit_nfse: true }.to_json) }

  def code
    key
  end

  def description
    "#{code} - #{value}"
  end
end
