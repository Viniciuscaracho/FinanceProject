# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_links
#
#  id              :bigint           not null, primary key
#  active          :boolean          default(TRUE), not null
#  description     :text
#  name            :string
#  settings        :jsonb
#  token           :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  account_user_id :bigint
#  service_id      :bigint
#
# Indexes
#
#  index_appointment_links_on_account_id       (account_id)
#  index_appointment_links_on_account_user_id  (account_user_id)
#  index_appointment_links_on_active           (active)
#  index_appointment_links_on_service_id       (service_id)
#  index_appointment_links_on_token            (token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (service_id => offers.id)
#
class AppointmentLink < ApplicationRecord
  acts_as_tenant :account

  belongs_to :account
  belongs_to :service, optional: true, class_name: 'Offer'
  belongs_to :account_user, optional: true

  validates :token, presence: true, uniqueness: true
  validates :name, presence: true

  before_validation :generate_token, on: :create

  scope :active, -> { where(active: true) }

  def to_param
    token
  end

  def public_url
    # Usar FRONTEND_URL se disponível, senão usar DEFAULT_HOST_NAME
    frontend_url = ENV.fetch('FRONTEND_URL', nil)
    if frontend_url.present?
      # Se FRONTEND_URL já inclui protocolo, usar diretamente
      if frontend_url.start_with?('http://', 'https://')
        "#{frontend_url}/agendar/#{token}"
      else
        protocol = Rails.env.production? ? 'https' : 'http'
        "#{protocol}://#{frontend_url}/agendar/#{token}"
      end
    else
      # Fallback para DEFAULT_HOST_NAME (backend)
      host = ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')
      protocol = Rails.env.production? ? 'https' : 'http'
      # Se for localhost:3000, redirecionar para frontend
      if host.include?('localhost:3000') || host.include?('127.0.0.1:3000')
        "#{protocol}://localhost:5173/agendar/#{token}"
      else
        "#{protocol}://#{host}/agendar/#{token}"
      end
    end
  end

  private

  def generate_token
    self.token ||= SecureRandom.alphanumeric(32)
  end
end

