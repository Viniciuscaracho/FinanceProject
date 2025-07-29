# frozen_string_literal: true

module Invoices
  class AttachmentsController < AttachmentsController
    protected

    # Use callbacks to share common setup or constraints between actions.
    def set_record
      @record = Current.account.invoices.with_attached_attachments.find(params[:invoice_id])
    end
  end
end
