# frozen_string_literal: true

module TagsHelper
  def render_tag_list(taggable:)
    return if taggable.taggings.empty?

    render(Elements::TagListComponent.new(taggable:))
  end
end
