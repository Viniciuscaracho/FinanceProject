# frozen_string_literal: true

module ActiveJobHelper
  # @param [Class] clazz
  # @param [Hash] args
  def self.perform(clazz, *args)
    return false unless clazz < ApplicationJob

    clazz.perform(*args, audit_user: Current.user)
  end

  # @param [Class] clazz
  # @param [Hash] args
  def self.perform_later(clazz, *args)
    return false unless clazz < ApplicationJob

    clazz.perform_later(*args, audit_user: Current.user)
  end
end
