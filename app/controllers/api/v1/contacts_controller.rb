# frozen_string_literal: true

module Api
  module V1
    class ContactsController < ApplicationController
      before_action :set_contact, only: [:show, :update, :destroy, :last_anamnese_response]

      def index
        @contacts = Current.account.contacts
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          contacts: @contacts.map { |contact| contact_json(contact) },
          meta: {
            current_page: @contacts.current_page,
            total_pages: @contacts.total_pages,
            total_count: @contacts.total_count
          }
        }
      end

      def show
        render json: { contact: contact_json(@contact) }
      end

      def create
        @contact = Current.account.contacts.build(contact_params)

        if @contact.save
          render json: { contact: contact_json(@contact) }, status: :created
        else
          render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @contact.update(contact_params)
          render json: { contact: contact_json(@contact) }
        else
          render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @contact.destroy
        render json: { message: 'Contato removido com sucesso' }
      end

      def last_anamnese_response
        response = Current.account.anamnese_responses
          .where(contact_id: @contact.id)
          .includes(:anamnese_template)
          .order(created_at: :desc)
          .first

        render json: { response: response&.as_json(include: :anamnese_template) }
      end

      def anamnese_history
        responses = Current.account.anamnese_responses
          .where(contact_id: @contact.id)
          .includes(:anamnese_template, :appointment)
          .order(created_at: :desc)
          .limit(20)

        render json: {
          responses: responses.map do |r|
            r.as_json(include: :anamnese_template).merge(
              appointment_start_time: r.appointment&.start_time&.iso8601
            )
          end
        }
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:id])
      end

      def contact_json(contact)
        contact.as_json.merge(
          name: contact.name,
          phone: contact.phone_number,
          document: contact.document_1,
          notes: contact.description,
          contact_type: contact.contact_type.to_s
        )
      end

      def contact_params
        # Mapear campos do frontend para campos do modelo
        permitted_params = params.require(:contact).permit(:name, :email, :phone, :document, :notes, :contact_type)
        
        # Converter campos para os nomes corretos do modelo
        contact_attributes = {}
        contact_attributes[:first_name] = permitted_params[:name] if permitted_params[:name].present?
        contact_attributes[:email] = permitted_params[:email] if permitted_params[:email].present?
        contact_attributes[:phone_number] = permitted_params[:phone] if permitted_params[:phone].present?
        contact_attributes[:document_1] = permitted_params[:document] if permitted_params[:document].present?
        contact_attributes[:description] = permitted_params[:notes] if permitted_params[:notes].present?
        
        # Mapear contact_type do frontend para o enum do modelo
        if permitted_params[:contact_type].present?
          type_mapping = {
            'customer' => :customer,
            'employee' => :employee,
            'supplier' => :supplier,
            'partner' => :partner,
            'associate' => :associate
          }
          contact_attributes[:contact_type] = type_mapping[permitted_params[:contact_type]] if type_mapping[permitted_params[:contact_type]]
        end
        
        contact_attributes
      end
    end
  end
end
