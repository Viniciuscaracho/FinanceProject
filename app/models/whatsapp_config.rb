# frozen_string_literal: true

# == Schema Information
#
# Table name: whatsapp_configs
#
#  id                      :bigint           not null, primary key
#  enabled                 :boolean          default(FALSE)
#  evolution_api_key       :string
#  evolution_api_url       :string
#  evolution_instance_name :string           default("default")
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  account_id              :bigint           not null
#
# Indexes
#
#  index_whatsapp_configs_on_account_id  (account_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class WhatsappConfig < ApplicationRecord
  acts_as_tenant :account

  belongs_to :account

  validates :account_id, uniqueness: true
  validates :evolution_api_url, presence: true, if: :enabled?
  validates :evolution_api_key, presence: true, if: :enabled?
  validates :evolution_instance_name, presence: true, if: :enabled?
  validates :evolution_api_url, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }, allow_blank: true

  scope :enabled, -> { where(enabled: true) }

  # Verifica se a configuração está completa e válida
  def configured?
    enabled? && 
    evolution_api_url.present? && 
    evolution_api_key.present? && 
    evolution_instance_name.present?
  end

  # Retorna a URL base sem barra no final
  def normalized_api_url
    return nil unless evolution_api_url.present?
    evolution_api_url.to_s.chomp('/')
  end
end


