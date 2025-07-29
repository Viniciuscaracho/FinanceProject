# frozen_string_literal: true

module SetTimeZone
  extend ActiveSupport::Concern

  DEFAULT_BROWSER_TZ = 'America/Sao_Paulo'

  included do
    helper_method :browser_time_zone
  end

  def browser_time_zone
    cookie_time_zone = cookies.fetch(:browser_time_zone, DEFAULT_BROWSER_TZ)
    browser_tz = ActiveSupport::TimeZone.find_tzinfo(cookie_time_zone)
    ActiveSupport::TimeZone.all.find { |zone| zone.tzinfo == browser_tz }
  rescue TZInfo::UnknownTimezone, TZInfo::InvalidTimezoneIdentifier
    browser_tz = ActiveSupport::TimeZone.find_tzinfo(DEFAULT_BROWSER_TZ)
    ActiveSupport::TimeZone.all.find { |zone| zone.tzinfo == browser_tz }
  end
end
