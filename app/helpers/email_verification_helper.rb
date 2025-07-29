# frozen_string_literal: true

# Path: app/helpers/email_verification_helper.rb
# Module for email verification
module EmailVerificationHelper
  # https://github.com/unkn0w/disposable-email-domain-list/blob/main/domains.json
  DUMMY_EMAIL_DOMAINS = (%w[example.com example.org example.net chodyi.com] + JSON.load_file(Rails.root.join('config/dummy_email_domains.json')).map(&:downcase)).compact.freeze

  def self.email_is_deliverable?(email:)
    return true if Rails.env.development? || Rails.env.test?
    return true if (email || '').strip.blank?

    options = {
      basic_auth: { username: 'api', password: Rails.application.credentials.dig(:mailgun, :private_key) },
      query: { address: email.strip.downcase }
    }
    response = HTTParty.get('https://api.mailgun.net/v4/address/validate', options)
    Rails.logger.debug "Email verification response: #{response.parsed_response}"
    return true unless response.success?

    data = OpenStruct.new(response.parsed_response)
    response.success? && data.result.in?(%w[deliverable unknown])
  end

  def self.email_is_dummy?(email:)
    return false if Rails.env.development? || Rails.env.test?
    return false if (email || '').strip.blank?

    DUMMY_EMAIL_DOMAINS.include?(email.strip.downcase.split('@').last)
  end
end
