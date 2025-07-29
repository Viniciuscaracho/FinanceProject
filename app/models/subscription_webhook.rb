# == Schema Information
#
# Table name: subscription_webhooks
#
#  id         :bigint           not null, primary key
#  details    :jsonb            not null
#  event      :jsonb            not null
#  event_type :string           not null
#  status     :string           default("pending"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class SubscriptionWebhook < ApplicationRecord
  after_create_commit :process_webhook

  STATUSES = %i[pending processed failed skipped].freeze
  as_enum :status, STATUSES, map: :string, source: :status

  def event_attributes
    super.slice(:id, :event_type, :status)
  end

  def event_previous_changes
    super.slice(:status, :updated_at)
  end

  def mark_as_processed!
    update!(status: 'processed')
  end

  def mark_as_failed!(message_log: nil, trace: [])
    update!(status: 'failed', details: { message_log:, trace: })
  end

  def mark_as_skipped!(message_log: nil)
    update!(status: 'skipped', details: { message_log: })
  end

  private

  def process_webhook
    SubscriptionWebhookHandlerJob.perform_later(id)
  end
end
