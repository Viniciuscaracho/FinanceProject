# frozen_string_literal: true

module Settings
  class Update < ApplicationService
    def call
      target = context.target
      settings = context.settings

      ActiveRecord::Base.transaction do
        (settings || {}).each do |key, value|
          result = update_settings(target, key, value)
          return context.fail!(message: target.errors.full_messages.first) unless result
        end
      end
    end

    private

    # @param [Object] target
    # @param [Object] key
    # @param [Hash] value
    def update_settings(target, key, value)
      target.settings(key).assign_attributes(value)
      target.save
    end
  end
end
