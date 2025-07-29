# == Schema Information
#
# Table name: webhooks
#
#  id            :bigint           not null, primary key
#  last_response :integer
#  last_used_at  :datetime
#  url           :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#
# Indexes
#
#  index_webhooks_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Webhook < ApplicationRecord
  belongs_to :account

  validates :url, presence: true, if: -> { account.api_enabled? }
  validates :url, allow_blank: true, format: { with: URI::DEFAULT_PARSER.make_regexp }

  def deliver(payload)
    WebhookDeliverJob.perform_later(self, payload)
  end

  def validate_url_format
    URI::DEFAULT_PARSER.make_regexp.match?(url)
  end
end
