# frozen_string_literal: true

module Contacts
  class AttachmentsController < AttachmentsController
    # include Contacts::SetCurrentParams

    protected

    # Use callbacks to share common setup or constraints between actions.
    def set_record
      @record = Current.account.contacts.with_attached_attachments.find(params[:contact_id])
    end
  end
end
