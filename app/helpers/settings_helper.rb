# frozen_string_literal: true

module SettingsHelper
  def grouped_expenses?
    @transaction_settings ||= Current.user.settings(:transactions)
    @transaction_settings.grouped_expenses
  end
end
