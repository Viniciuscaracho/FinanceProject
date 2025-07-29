# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  include Audited::ActiveJob
  include RailsEventStoreHelper

  sidekiq_options retry: true unless Rails.env.test?
  discard_on ActiveJob::DeserializationError

  # Set current user and account
  before_enqueue do |job|
    build_default_options(job)
  end

  around_perform do |job, block|
    build_current_attributes(job)
    block.call
  end

  protected

  def build_default_options(job)
    options = job.arguments.extract_options! || {}
    options[:audit_user] = Current.user if Current.user.present?
    options[:ip_address] = Current.ip_address if Current.ip_address.present?
    options[:request_id] = Current.request_id if Current.request_id.present?
    options[:user_agent] = Current.user_agent if Current.user_agent.present?

    job.arguments << options if options.present?
  end

  def build_current_attributes(job)
    options = job.arguments.extract_options! || {}
    Current.user       ||= audit_user
    Current.account    ||= Current.user&.account
    Current.time       ||= DateTime.current
    Current.date       ||= Date.current
    Current.ip_address ||= options.delete(:ip_address)
    Current.request_id ||= options.delete(:request_id)
    Current.user_agent ||= options.delete(:user_agent)

    set_sentry_user_context
    set_sentry_tags_context

    job.arguments << options if options.present?
  end

  def set_sentry_user_context
    Sentry.set_user(
      id: Current.user&.id,
      email: Current.user&.email,
      username: Current.user&.name,
      ip_address: Current.ip_address
    )
  end

  def set_sentry_tags_context
    Sentry.set_tags(
      request_id: Current.request_id,
      user_agent: Current.user_agent
    )
  end

  def current_account
    Current.account
  end

  def logger
    Rails.logger
  end
end
