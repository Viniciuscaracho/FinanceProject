# frozen_string_literal: true

# == Schema Information
#
# Table name: api_tokens
#
#  id           :bigint           not null, primary key
#  description  :string
#  expires_at   :datetime
#  last_used_at :datetime
#  name         :string
#  token        :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  account_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_api_tokens_on_account_id  (account_id)
#  index_api_tokens_on_token       (token) UNIQUE
#  index_api_tokens_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (user_id => users.id)
#
class ApiToken < ApplicationRecord
  belongs_to :account
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :name, presence: true
  encrypts :token, deterministic: true
  scope :active, -> { where("expires_at > ?", Time.current) }

  before_validation :generate_token, on: :create

  def expired?
    expires_at < Time.current unless expires_at.nil?
  end

  def created_by
    User.find(users_id)
  end

  def can?(action, record)
    return false if expired?

    settings(record.name.underscore.to_sym).send(action)
  end

  private

  def generate_token
    loop do
      self.token = SecureRandom.alphanumeric(128)
      break unless ApiToken.exists?(token: token)
    end
  end

end
