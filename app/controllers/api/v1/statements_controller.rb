# frozen_string_literal: true

module Api
  module V1
    class StatementsController < ApplicationController
      before_action :set_statement, only: [:show, :update, :destroy, :finish]

      def index
        @statements = Current.account.statements
          .includes(:bank_account)
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          statements: @statements.as_json(
            include: [:bank_account],
            methods: [:confirmed_count, :ignored_count, :pending_count, :reconciled_count, :unreconciled_count]
          ),
          meta: {
            current_page: @statements.current_page,
            total_pages: @statements.total_pages,
            total_count: @statements.total_count
          }
        }
      end

      def show
        render json: {
          statement: @statement.as_json(
            include: [:bank_account],
            methods: [:confirmed_count, :ignored_count, :pending_count, :reconciled_count, :unreconciled_count]
          )
        }
      end

      def create
        result = Statements::Create.call(
          current_account: Current.account,
          statement_params: statement_params
        )

        if result.success?
          render json: {
            statement: result.statement.as_json(
              include: [:bank_account],
              methods: [:confirmed_count, :ignored_count, :pending_count, :reconciled_count, :unreconciled_count]
            )
          }, status: :created
        else
          render json: { errors: [result.message] }, status: :unprocessable_entity
        end
      end

      def update
        if @statement.update(statement_params)
          render json: {
            statement: @statement.as_json(
              include: [:bank_account],
              methods: [:confirmed_count, :ignored_count, :pending_count, :reconciled_count, :unreconciled_count]
            )
          }
        else
          render json: { errors: @statement.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @statement.destroy
        head :no_content
      end

      def finish
        result = Statements::Finish.call(
          statement: @statement,
          account: @statement.account
        )

        if result.success?
          render json: {
            statement: @statement.reload.as_json(
              include: [:bank_account],
              methods: [:confirmed_count, :ignored_count, :pending_count, :reconciled_count, :unreconciled_count]
            ),
            message: result.message || 'Reconciliação finalizada com sucesso'
          }
        else
          render json: { errors: [result.message || result.error] }, status: :unprocessable_entity
        end
      end

      private

      def set_statement
        @statement = Current.account.statements.find(params[:id])
      end

      def statement_params
        params.require(:statement).permit(
          :bank_account_id,
          :starts_at,
          :ends_at,
          :type_cd,
          file: []
        )
      end
    end
  end
end

