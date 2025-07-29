# frozen_string_literal: true

class ApplicationRecord < ActiveRecord::Base
  self.store_attribute_unset_values_fallback_to_default = true
  primary_abstract_class

  # Multi databases configurations
  # connects_to database: { writing: :primary_write, reading: :primary_read }

  include ActionView::RecordIdentifier
  include RailsEventStoreHelper
  include Rails.application.routes.url_helpers

  # Orders results by column and direction
  def self.sort_by_params(column, direction, default_column: 'created_at')
    sortable_column = column.presence_in(sortable_columns) || default_column
    order(sortable_column => direction)
  end

  # Returns an array of sortable columns on the model
  # Used with the Sortable controller concern
  #
  # Override this method to add/remove sortable columns
  def self.sortable_columns
    @sortable_columns ||= columns.map(&:name)
  end

  def self.lock_for_update_nowait
    lock('FOR UPDATE NOWAIT')
  end

  def self.with_advisory_lock_by_id(id, &block)
    with_advisory_lock("#{table_name}:#{id}", &block)
  end

  def with_self_advisory_lock(&block)
    self.class.transaction do
      self.class.with_advisory_lock_by_id(id, &block)
    end
  end

  def event_previous_changes
    previous_changes.symbolize_keys
  end

  def skip_publish!
    @skip_publish = true
  end

  def skip_publish?
    @skip_publish.to_boolean
  end

  def publish(event, payload = {})
    return if skip_publish?

    super(event, payload)
  end

  def publish_async(event, payload = {})
    return if skip_publish?

    super(event, payload)
  end

  def render_jbuilder_api_v1(view = "api/v1/#{self.class.model_name.plural}/#{self.class.model_name.singular}")
    renderer = Api::BaseController.renderer.new(
      http_host: Rails.application.routes.default_url_options[:host],
      https: Rails.env.production?
    )
    JSON.parse renderer.render_to_string(partial: view, locals: { self.class.model_name.singular.to_sym => self })
  end

  def to_webhook_data
    render_jbuilder_api_v1
  end
end
