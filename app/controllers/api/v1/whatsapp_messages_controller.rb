# frozen_string_literal: true

module Api
  module V1
    class WhatsappMessagesController < ApplicationController
      before_action :set_current_account

      # GET /api/v1/whatsapp_messages
      # Parâmetros opcionais: phone (número normalizado), event_type, status, limit
      def index
        messages = Current.account.whatsapp_messages
                          .includes(:contact)
                          .order(created_at: :desc)

        if params[:phone].present?
          normalized = params[:phone].to_s.gsub(/\D/, '')
          contact_ids = Current.account.contacts
                               .where(cell_phone_number: normalized)
                               .or(Current.account.contacts.where(phone_number: normalized))
                               .pluck(:id)
          messages = messages.where(contact_id: contact_ids)
        end

        messages = messages.where(event_type: params[:event_type]) if params[:event_type].present?
        messages = messages.where(status: params[:status])         if params[:status].present?
        limit = params[:limit].present? ? params[:limit].to_i.clamp(1, 100) : 50
        messages = messages.limit(limit)

        render json: messages.map { |m| message_json(m) }
      end

      private

      def message_json(msg)
        {
          id:              msg.id,
          event_type:      msg.event_type,
          status:          msg.status,
          channel:         msg.channel,
          body:            msg.body,
          scheduled_for:   msg.scheduled_for&.iso8601,
          sent_at:         msg.sent_at&.iso8601,
          error_message:   msg.error_message,
          idempotency_key: msg.idempotency_key,
          contact: {
            id:    msg.contact_id,
            name:  msg.contact&.name,
            phone: msg.contact&.cell_phone_number,
          },
          created_at: msg.created_at.iso8601,
        }
      end
    end
  end
end
