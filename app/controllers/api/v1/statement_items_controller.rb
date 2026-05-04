# frozen_string_literal: true

module Api
  module V1
    class StatementItemsController < ApplicationController
      before_action :set_statement
      before_action :set_statement_item, only: [:show, :update, :confirm, :ignore, :reset, :reconcile]

      STATEMENT_ITEM_INCLUDES = [:contact, :category, :related_transaction, :bank_account_source, :bank_account_target].freeze

      def index
        @statement_items = @statement.statement_items
          .includes(*STATEMENT_ITEM_INCLUDES)
          .order(created_at: :asc)
          .page(params[:page])
          .per(params[:per_page] || 50)

        if params[:status].present?
          status_map = {
            'pending'       => [0, 1],
            'confirmed'     => [2],
            'ignored'       => [3],
            'reconciled'    => [4],
            'unreconciled'  => [5]
          }
          status_codes = status_map[params[:status]] || []
          @statement_items = @statement_items.where(status_cd: status_codes) if status_codes.any?
        end

        if params[:q].present?
          @statement_items = @statement_items.where(
            "name ILIKE ? OR memo ILIKE ? OR document_number ILIKE ?",
            "%#{params[:q]}%", "%#{params[:q]}%", "%#{params[:q]}%"
          )
        end

        render json: {
          statement_items: @statement_items.as_json(include: STATEMENT_ITEM_INCLUDES),
          meta: {
            current_page:      @statement_items.current_page,
            total_pages:       @statement_items.total_pages,
            total_count:       @statement_items.total_count,
            confirmed_count:   @statement.confirmed_count,
            ignored_count:     @statement.ignored_count,
            pending_count:     @statement.pending_count,
            reconciled_count:  @statement.reconciled_count,
            unreconciled_count: @statement.unreconciled_count
          }
        }
      end

      def show
        render json: { statement_item: @statement_item.as_json(include: STATEMENT_ITEM_INCLUDES) }
      end

      def update
        result = StatementItems::Update.call(
          statement_item: @statement_item,
          action:         params[:action_type] || 'update',
          params:         statement_item_params
        )

        if result.success?
          render json: {
            statement_item: @statement_item.reload.as_json(include: STATEMENT_ITEM_INCLUDES),
            message:        result.message
          }
        else
          render json: { errors: [result.message || @statement_item.errors.full_messages] }, status: :unprocessable_entity
        end
      end

      def confirm
        result = StatementItems::Confirm.call(statement_item: @statement_item)

        if result.success?
          render json: { statement_item: @statement_item.reload.as_json(include: STATEMENT_ITEM_INCLUDES) }
        else
          render json: { errors: [result.message || @statement_item.errors.full_messages] }, status: :unprocessable_entity
        end
      end

      def ignore
        result = StatementItems::Ignore.call(statement_item: @statement_item)

        if result.success?
          render json: { statement_item: @statement_item.reload.as_json(include: STATEMENT_ITEM_INCLUDES) }
        else
          render json: { errors: [result.message || @statement_item.errors.full_messages] }, status: :unprocessable_entity
        end
      end

      def reset
        result = StatementItems::Reset.call(statement_item: @statement_item)

        if result.success?
          render json: { statement_item: @statement_item.reload.as_json(include: STATEMENT_ITEM_INCLUDES) }
        else
          render json: { errors: [result.message || @statement_item.errors.full_messages] }, status: :unprocessable_entity
        end
      end

      def reconcile
        if @statement_item.reconcile
          render json: { statement_item: @statement_item.reload.as_json(include: STATEMENT_ITEM_INCLUDES) }
        else
          render json: { errors: @statement_item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def bulk_confirm
        items = @statement.statement_items.where(id: params[:item_ids] || [])
        items.find_each { |item| StatementItems::Confirm.call(statement_item: item) }
        render json: { message: "#{items.count} item(ns) confirmado(s) com sucesso", count: items.count }
      end

      def bulk_ignore
        items = @statement.statement_items.where(id: params[:item_ids] || [])
        items.find_each { |item| StatementItems::Ignore.call(statement_item: item) }
        render json: { message: "#{items.count} item(ns) ignorado(s) com sucesso", count: items.count }
      end

      private

      def set_statement
        @statement = Current.account.statements.find(params[:statement_id])
      end

      def set_statement_item
        @statement_item = @statement.statement_items.find(params[:id])
      end

      def statement_item_params
        params.require(:statement_item).permit(
          :name, :memo, :due_date, :posted_at, :document_number,
          :amount_cents, :amount_currency, :transaction_type_cd, :type_cd,
          :contact_id, :category_id, :bank_account_source_id,
          :bank_account_target_id, :related_transaction_id
        )
      end
    end
  end
end
