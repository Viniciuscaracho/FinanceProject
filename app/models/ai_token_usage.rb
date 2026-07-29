# frozen_string_literal: true

# == Schema Information
#
# Table name: ai_token_usages
#
#  id            :bigint           not null, primary key
#  input_tokens  :integer          default(0), not null
#  model         :string           not null
#  output_tokens :integer          default(0), not null
#  service       :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint
#  contact_id    :bigint
#
# Indexes
#
#  index_ai_token_usages_on_account_id_and_created_at  (account_id,created_at)
#  index_ai_token_usages_on_created_at                 (created_at)
#  index_ai_token_usages_on_service_and_created_at     (service,created_at)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id) ON DELETE => nullify
#  fk_rails_...  (contact_id => people.id) ON DELETE => nullify
#
class AiTokenUsage < ApplicationRecord
  belongs_to :account, optional: true
  belongs_to :contact, class_name: 'Contact', foreign_key: :contact_id, optional: true

  PRICING_PER_MTOK = {
    'gpt-4o-mini'       => { input: 0.15, output: 0.60 },
    'gpt-4o'            => { input: 2.50, output: 10.0 },
    'gpt-4.1-mini'      => { input: 0.40, output: 1.60 },
  }.freeze

  DEFAULT_PRICING = { input: 0.15, output: 0.60 }.freeze

  scope :since, ->(time) { where('created_at >= ?', time) }
  scope :for_account, ->(account) { where(account_id: account&.id) }

  def self.pricing_for(model)
    return DEFAULT_PRICING if model.blank?

    exact = PRICING_PER_MTOK[model]
    return exact if exact

    match = PRICING_PER_MTOK.keys.select { |k| model.start_with?(k) }.max_by(&:length)
    match ? PRICING_PER_MTOK[match] : DEFAULT_PRICING
  end

  # Custo estimado em USD desta linha.
  def estimated_cost_usd
    price = self.class.pricing_for(model)
    (input_tokens.to_i * price[:input] + output_tokens.to_i * price[:output]) / 1_000_000.0
  end

  def total_tokens
    input_tokens.to_i + output_tokens.to_i
  end
end
