# frozen_string_literal: true

module Categories
  class Create < ApplicationService
    def call
      context.category = context.account.categories.new(context.category_params)
      return dispatch_event if context.category.save

      add_fail_message(context.category)
    end

    private

    def dispatch_event
      # EventModelDispatcher.call(model: context.category, event: Categories::CategoryCreated)
    end
  end
end
