# frozen_string_literal: true

# == Schema Information
#
# Table name: anamnese_templates
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE), not null
#  description :text
#  fields      :jsonb            not null
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint           not null
#
# Indexes
#
#  index_anamnese_templates_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class AnamneseTemplate < ApplicationRecord
  acts_as_tenant :account

  has_many :anamnese_responses, dependent: :nullify

  validates :name, presence: true, length: { maximum: 200 }

  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }
end
