# frozen_string_literal: true

Rails.configuration.after_initialize do
  # Subscribe all descendant classes of ApplicationSubscriber
  ApplicationSubscriber.reload
end
