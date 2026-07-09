# frozen_string_literal: true

class CoachingAlertsJob < ApplicationJob
  queue_as :default

  def perform
    accounts = Account.all
    total = 0

    accounts.find_each do |account|
      alerts = Coaching::DetectorService.new(account).call
      next if alerts.empty?

      Rails.logger.info "[CoachingAlertsJob] account ##{account.id}: #{alerts.size} alerta(s)"
      total += alerts.size
    rescue StandardError => e
      Rails.logger.error "[CoachingAlertsJob] account ##{account.id}: #{e.message}"
    end

    Rails.logger.info "[CoachingAlertsJob] total: #{total} alerta(s) detectados"
  end
end
