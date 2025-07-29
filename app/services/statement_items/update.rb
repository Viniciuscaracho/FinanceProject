# frozen_string_literal: true

module StatementItems
  class Update < ApplicationService
    def call
      return if context.statement_item.update(update_params)

      add_fail_message(context.statement_item)
    end

    private

    def update_params
      case context.action
      when 'confirm'
        context.message = I18n.t('statements.statement_items.confirm.success')
        context.params.merge(status: :confirmed, confirmed_at: Time.current, ignored_at: nil)
      when 'ignore'
        context.message = I18n.t('statements.statement_items.ignore.success')
        context.params.merge(status: :ignored, ignored_at: Time.current, confirmed_at: nil)
      else
        context.message = I18n.t('statements.statement_items.update.success')
        context.params
      end
    end
  end
end
