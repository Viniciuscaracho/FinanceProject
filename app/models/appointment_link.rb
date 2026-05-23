# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_links
#
#  id                 :bigint           not null, primary key
#  active             :boolean          default(TRUE), not null
#  description        :text
#  enable_google_meet :boolean          default(FALSE)
#  name               :string
#  settings           :jsonb
#  token              :string           not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  account_id         :bigint           not null
#  account_user_id    :bigint
#  service_id         :bigint
#
# Indexes
#
#  index_appointment_links_on_account_id        (account_id)
#  index_appointment_links_on_account_user_id   (account_user_id)
#  index_appointment_links_on_active            (active)
#  index_appointment_links_on_service_id        (service_id)
#  index_appointment_links_on_token             (token) UNIQUE
#  index_appointment_links_on_token_and_active  (token,active) WHERE (active = true)
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
    frontend_url = ENV.fetch('FRONTEND_URL', nil)
    base = if frontend_url.present?
      frontend_url.start_with?('http://', 'https://') ? frontend_url : "https://#{frontend_url}"
    elsif Rails.env.development? || Rails.env.test?
      'http://localhost:5173'
    end
    return nil if base.nil?
    "#{base}/agendar/#{token}"
  end

  private

  def generate_token
    self.token ||= SecureRandom.alphanumeric(32)
  end
end

