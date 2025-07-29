class ReceiptsController < ApplicationController
  before_action :set_current_account
  before_action :set_current_transaction
  before_action :set_current_transaction_type
  before_action :set_receipt_templates
  before_action :set_current_template
  before_action :set_current_receipt_content

  def new
    authorize! :create, :receipts
  end


  private

  def set_current_transaction
    @current_transaction = current_account.transactions.find(params[:transaction])
  end

  def set_current_account
    @current_account = Current.account
  end

  def set_current_user
    @current_user = Current.user
  end

  def set_current_transaction_type
    @current_transaction_type = @current_transaction.transaction_type
  end

  def set_current_receipt_content
    @current_receipt_content = Documents::Receipts::ReceiptGenerator.call(
      account: @current_account,
      user: @current_user,
      template: @current_receipt_template,
      transaction: @current_transaction
    ).content
  end

  def set_current_template
    @current_receipt_template = if params[:receipt_template_id].present?
                                  @receipt_templates.find(params[:receipt_template_id])
                                else
                                  @receipt_templates.first
                                end

  end

  def set_receipt_templates
    @receipt_templates = @current_account.receipt_templates.where(transaction_type_cd: @current_transaction.revenue? ? 0 : 1 )
  end

end
