# frozen_string_literal: true

module Coaching
  class DetectorService
    SEM_FEEDBACK_DIAS   = 7
    REAVALIACAO_DIAS    = 7

    def initialize(account)
      @account = account
    end

    def call
      alerts = []

      sem_feedback.each do |profile|
        days = days_since(profile.last_feedback_at)
        alerts << {
          contact_id:   profile.contact_id,
          contact_name: profile.contact.name,
          alert_type:   'sem_feedback',
          days_since:   days
        }
      end

      reavaliacoes.each do |profile|
        days = days_until(profile.next_reassessment_at)
        alerts << {
          contact_id:   profile.contact_id,
          contact_name: profile.contact.name,
          alert_type:   'reavaliacao_proxima',
          days_until:   days
        }
      end

      alerts
    end

    private

    def sem_feedback
      CoachingProfile
        .where(account: @account)
        .where('last_feedback_at < ? OR last_feedback_at IS NULL', SEM_FEEDBACK_DIAS.days.ago)
        .includes(:contact)
    end

    def reavaliacoes
      CoachingProfile
        .where(account: @account)
        .where(next_reassessment_at: Time.current..REAVALIACAO_DIAS.days.from_now)
        .includes(:contact)
    end

    def days_since(datetime)
      return nil if datetime.nil?
      ((Time.current - datetime) / 1.day).ceil
    end

    def days_until(datetime)
      return nil if datetime.nil?
      ((datetime - Time.current) / 1.day).ceil
    end
  end
end
