# frozen_string_literal: true

module Categories
  class Update < ApplicationService
    def call
      return dispatch_event if context.category.update(context.category_params)

      add_fail_message(context.category)
    end

    private

    def dispatch_event
      # # publish 'category_updated', category: context.category
    end
  end
end
