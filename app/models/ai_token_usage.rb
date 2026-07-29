# frozen_string_literal: true

# Registro de consumo de tokens das chamadas de IA (Anthropic) do coaching.
# Gravado por Coaching::AnthropicClient a cada chamada bem-sucedida. Serve de
# base para a observabilidade de custo no painel Admin.
#
# Preços em USD por 1 milhão de tokens (input/output). Ajuste aqui se a Anthropic
# alterar a tabela ou se o modelo padrão mudar.
class AiTokenUsage < ApplicationRecord
  belongs_to :account, optional: true
  belongs_to :contact, class_name: 'Contact', foreign_key: :contact_id, optional: true

  PRICING_PER_MTOK = {
    'claude-haiku-4-5'  => { input: 1.0,  output: 5.0 },
    'claude-sonnet-4-5' => { input: 3.0,  output: 15.0 },
    'claude-opus-4-1'   => { input: 15.0, output: 75.0 }
  }.freeze

  # Fallback usado quando o id do modelo tem sufixo de data (ex.:
  # "claude-haiku-4-5-20251001") — casa pelo prefixo conhecido mais longo.
  DEFAULT_PRICING = { input: 1.0, output: 5.0 }.freeze

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
