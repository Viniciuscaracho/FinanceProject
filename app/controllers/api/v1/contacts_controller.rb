# frozen_string_literal: true

module Api
  module V1
    class ContactsController < ApplicationController
      before_action :set_contact, only: [:show, :update, :destroy]

      def index
        @contacts = Current.account.contacts
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          contacts: @contacts.as_json,
          meta: {
            current_page: @contacts.current_page,
            total_pages: @contacts.total_pages,
            total_count: @contacts.total_count
          }
        }
      end

      def show
        render json: { contact: @contact.as_json }
      end

      def create
        @contact = Current.account.contacts.build(contact_params)

        if @contact.save
          render json: { contact: @contact.as_json }, status: :created
        else
          render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @contact.update(contact_params)
          render json: { contact: @contact.as_json }
        else
          render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @contact.destroy
        render json: { message: 'Contato removido com sucesso' }
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:id])
      end

      def contact_params
        # Mapear campos do frontend para campos do modelo
        permitted_params = params.require(:contact).permit(:name, :email, :phone, :document, :notes)
        
        # Converter campos para os nomes corretos do modelo
        contact_attributes = {}
        contact_attributes[:first_name] = permitted_params[:name] if permitted_params[:name].present?
        contact_attributes[:email] = permitted_params[:email] if permitted_params[:email].present?
        contact_attributes[:phone_number] = permitted_params[:phone] if permitted_params[:phone].present?
        contact_attributes[:document_1] = permitted_params[:document] if permitted_params[:document].present?
        contact_attributes[:description] = permitted_params[:notes] if permitted_params[:notes].present?
        
        contact_attributes
      end
    end
  end
end
