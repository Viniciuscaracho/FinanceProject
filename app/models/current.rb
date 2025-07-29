# frozen_string_literal: true

# A word of caution: It's easy to overdo a global singleton like Current and tangle your model as a result.
# Current should only be used for a few, top-level globals, like account, user, and request details.
# The attributes stuck in Current should be used by more or less all actions on all requests.
# If you start sticking controller-specific attributes in there, you're going to create a mess.

class Current < ActiveSupport::CurrentAttributes
  attribute :user, :account, :partner, :request_id, :user_agent, :ip_address, :time, :date, :default_currency

  resets do
    Time.zone = 'Brasilia'
  end

  def user=(value)
    super

    Time.zone = value&.time_zone || Time.zone
    self.default_currency = value&.account&.default_currency || :BRL
  end
end
