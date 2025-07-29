# frozen_string_literal: true

module Attachments
  module Accountable
    extend ActiveSupport::Concern

    included do
      belongs_to :account, optional: true

      before_save do
        self.account ||= record if record.is_a?(Account)
        self.account ||= record&.account if record.respond_to?(:account)
        self.account ||= Current.account if Current.account.present?
      end
    end
  end
end
