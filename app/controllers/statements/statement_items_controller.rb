# frozen_string_literal: true

module Statements
  class StatementItemsController < ApplicationController
    before_action :set_statement
    before_action :set_statement_item,
                  only: %i[update confirm ignore reset new_one find_transaction select_transaction search_transactions]
    before_action :set_current_period, only: %i[find_transaction search_transactions]
    before_action :set_transaction_types, only: %i[find_transaction search_transactions]
    before_action :set_query_param, only: %i[find_transaction search_transactions]

    # GET /statements
    def index
      authorize! :read, @statement

      query = @statement.statement_items.order(created_at: :asc)
      query = query.search_by_q(params[:q]) if params[:q].present?

      @pagy, @records = pagy(query)
    end

    def find_transaction
      authorize! :read, @statement

      fetch_transactions
    end

    def search_transactions
      authorize! :read, @statement

      fetch_transactions
    end

    def select_transaction
      authorize! :update, @statement

      transaction = Current.account.transactions.find(params[:transaction_id])

      @statement_item.related_transaction = transaction
      @statement_item.name = transaction.name
      @statement_item.transaction_type = transaction.transaction_type
      if transaction.transfer?
        @statement_item.contact = nil
        @statement_item.category = nil
        @statement_item.bank_account_source = transaction.bank_account
        @statement_item.bank_account_target = transaction.transfer_to
      else
        @statement_item.contact = transaction.contact
        @statement_item.category = transaction.category
        @statement_item.bank_account_source = transaction.bank_account
        @statement_item.bank_account_target = nil
      end

      flash.now.notice = t('.success') if @statement_item.save
    end

    def new_one
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::NewOne.call(statement_item: @statement_item)
        if result.success?
          format.html { redirect_to edit_statement_url(@statement_item.statement) }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @statement_item.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /statements/1/statement_items/1/confirm or /statements/1/statement_items/1/confirm.json
    def confirm
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::Confirm.call(statement_item: @statement_item)
        if result.success?
          notice = t('.success')
          format.html { redirect_to edit_statement_url(@statement), notice: }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @statement_item.errors, status: :unprocessable_entity }
          format.turbo_stream { flash.now.alert = @statement_item.errors.full_messages.first }
        end
      end
    end

    def bulk_confirm
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::BulkConfirm.call(
          statement: @statement,
          statement_item_ids: bulk_item_statement_ids
        )
        if result.success?
          @confirmed_items = @statement.statement_items.where(id: bulk_item_statement_ids)
                                       .includes(:contact, :category, :bank_account_source, :bank_account_target, :related_transaction)
                                       .order(:posted_at, :id)
          notice = t('.success')
          format.html { redirect_to edit_statement_url(@statement), notice: }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: result.statement_item.errors, status: :unprocessable_entity }
          format.turbo_stream { flash.now.alert = result.statement_item.errors.full_messages.first }
        end
      end
    end

    # PATCH/PUT /statements/1/statement_items/1/confirm or /statements/1/statement_items/1/confirm.json
    def ignore
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::Ignore.call(statement_item: @statement_item)
        if result.success?
          notice = t('.success')
          format.html { redirect_to edit_statement_url(@statement), notice: }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @statement_item.errors, status: :unprocessable_entity }
          format.turbo_stream { flash.now.alert = @statement_item.errors.full_messages.first }
        end
      end
    end

    def bulk_ignore
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::BulkIgnore.call(
          statement: @statement,
          statement_item_ids: bulk_item_statement_ids
        )
        if result.success?
          @ignored_items = @statement.statement_items.where(id: bulk_item_statement_ids)
                                     .includes(:contact, :category, :bank_account_source, :bank_account_target, :related_transaction)
                                     .order(:posted_at, :id)
          notice = t('.success')
          format.html { redirect_to edit_statement_url(@statement), notice: }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: result.statement_item.errors, status: :unprocessable_entity }
          format.turbo_stream { flash.now.alert = result.statement_item.errors.full_messages.first }
        end
      end
    end

    def reset
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::Reset.call(statement_item: @statement_item)
        if result.success?
          format.html { redirect_to edit_statement_url(@statement_item.statement) }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @statement_item.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /statements/1/statement_items/1 or /statements/1/statement_items/1.json
    def update
      authorize! :update, @statement

      respond_to do |format|
        result = StatementItems::Update.call(
          statement_item: @statement_item,
          action: params[:button],
          params: statement_item_params
        )
        if result.success?
          notice = result.message
          format.html { redirect_to edit_statement_url(@statement_item.statement), notice: }
          format.json { render :show, status: :ok, location: @statement_item }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @statement_item.errors, status: :unprocessable_entity }
          format.turbo_stream { flash.now.alert = @statement_item.errors.full_messages.first }
        end
      end
    end

    # DELETE /statements/1 or /statements/1.json
    def destroy
      authorize! :update, @statement

      @statement.destroy
      respond_to do |format|
        notice = t('.success')
        format.html { redirect_to edit_statement_url(@statement_item.statement), notice: }
        format.json { head :no_content }
        format.turbo_stream { flash.now.notice = notice }
      end
    end

    private

    # Use callbacks to share common setup or constraints between actions.
    def set_statement
      @statement = Current.account.statements.find(params[:statement_id])
    end

    def set_statement_item
      @statement_item = @statement.statement_items.find(params[:id])
    end

    def set_current_period
      @current_start_date = params.fetch(:start_date, @statement_item.posted_at.beginning_of_month)
      @current_end_date   = params.fetch(:end_date, @statement_item.posted_at.end_of_month)
      @current_period     = (@current_start_date..@current_end_date)
    end

    def set_transaction_types
      @current_transaction_types = case @statement_item.type
                                   when :credit
                                     [0, 5]
                                   else
                                     [1, 2, 3, 4, 5]
                                   end
    end

    def set_query_param
      @current_query_param = params[:q]
    end

    # Only allow a list of trusted parameters through.
    def statement_item_params
      params.require(:statement_item).permit(
        :due_date, :name, :transaction_type, :contact_id, :category_id, :bank_account_source_id, :bank_account_target_id,
        :amount_cents
      )
    end

    def bulk_item_statement_ids
      params.fetch(:statement_item_ids, [])
    end

    def fetch_transactions
      query = Current.account.transactions.where(
        due_date: @current_period,
        transaction_type_cd: @current_transaction_types
        # amount_cents: @statement_item.amount_cents
      )

      if @statement_item.credit?
        query = query.where(
          '((transaction_type_cd = 0 AND bank_account_id = :bank_account_id) OR (transaction_type_cd = 5 AND transfer_to_id = :bank_account_id))', bank_account_id: @statement.bank_account_id
        )
      else
        query = query.where(
          '((transaction_type_cd in (1,2,3,4) AND bank_account_id = :bank_account_id) OR (transaction_type_cd = 5 AND bank_account_id = :bank_account_id))', bank_account_id: @statement.bank_account_id
        )
      end

      if @statement_item.related_transaction_id.present?
        query = query.where.not(id: @statement_item.related_transaction_id)
      end

      query = if @current_query_param.present?
                query.search_by_q(@current_query_param)
              else
                query.where(amount_cents: @statement_item.amount_cents)
              end

      after = params[:after].presence&.to_s
      order_by = :due_date
      order = :desc

      pagination = RailsCursorPagination::Paginator.new(query, after:, order_by:, order:).fetch

      @records = pagination[:page].map { |hash| hash[:data] }
      @end_cursor = pagination[:page_info][:end_cursor]
      @has_next_page = pagination[:page_info][:has_next_page]
    end
  end
end
