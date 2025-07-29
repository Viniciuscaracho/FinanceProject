# frozen_string_literal: true

Rails.configuration.to_prepare do
  ActsAsTaggableOn::Tag.include Tags::Searchable
end
