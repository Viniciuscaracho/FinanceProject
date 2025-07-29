# frozen_string_literal: true

module Transactions
  class AttachmentsController < AttachmentsController
    include Transactions::SetCurrentParams

    protected

    # Use callbacks to share common setup or constraints between actions.
    def set_record
      @record = Current.account.transactions.with_attached_attachments.find(params[:transaction_id])
    end
  end
end
