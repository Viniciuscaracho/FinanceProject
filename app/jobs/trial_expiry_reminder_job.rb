# frozen_string_literal: true

class TrialExpiryReminderJob < ApplicationJob
  queue_as :default

  REMINDER_DAYS = [7, 3, 1].freeze

  def perform
    REMINDER_DAYS.each do |days|
      target_date = Date.current + days.days

      accounts = Account.where(trial: true, suspended: false)
                        .where(trial_ends_at: target_date.beginning_of_day..target_date.end_of_day)
                        .includes(:owner, :company)

      accounts.find_each(batch_size: 50) do |account|
        email = account.email.presence || account.owner&.email
        next unless email.present?

        TrialExpiryMailer.expiry_reminder(account, days).deliver_later
      rescue StandardError => e
        Rails.logger.error("TrialExpiryReminderJob: failed for account #{account.id} — #{e.message}")
      end
    end
  rescue StandardError => e
    Rails.logger.error("TrialExpiryReminderJob failed: #{e.message}")
  end
end
