# frozen_string_literal: true

module Api
  module V1
    class AppointmentLinksController < ApplicationController
      before_action :set_appointment_link, only: [:show, :update, :destroy]

      def index
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        render json: Current.account.appointment_links
          .includes(:service, account_user: :user)
          .order(created_at: :desc)
          .map { |link| appointment_link_json(link) }
      rescue => e
        render json: { error: e.message }, status: :internal_server_error
      end

      def show
        render json: appointment_link_json(@appointment_link)
      end

      def create
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        link = Current.account.appointment_links.build(appointment_link_params)
        if link.save
          render json: appointment_link_json(link), status: :created
        else
          render json: { errors: link.errors.full_messages }, status: :unprocessable_entity
        end
      rescue => e
        render json: { error: e.message }, status: :internal_server_error
      end

      def update
        if @appointment_link.update(appointment_link_params)
          render json: appointment_link_json(@appointment_link)
        else
          render json: { errors: @appointment_link.errors.full_messages }, status: :unprocessable_entity
        end
      rescue => e
        render json: { error: e.message }, status: :internal_server_error
      end

      def destroy
        @appointment_link.destroy
        head :no_content
      end

      private

      def set_appointment_link
        return render json: { error: 'Account not found' }, status: :forbidden unless Current.account

        @appointment_link = Current.account.appointment_links.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
      end

      def appointment_link_params
        params.require(:appointment_link).permit(
          :name, :description, :active, :service_id, :account_user_id,
          :link_type, :enable_google_meet, settings: {}
        ).tap do |permitted|
          if permitted[:settings].present? && permitted[:settings].is_a?(String)
            permitted[:settings] = JSON.parse(permitted[:settings]) rescue {}
          end

          permitted[:settings] ||= {}

          link_type = permitted.delete(:link_type) || params[:appointment_link]&.dig(:link_type)
          permitted[:settings]['link_type'] = link_type if link_type.present?

          unless permitted[:settings].key?('days_ahead')
            permitted[:settings]['days_ahead'] = (permitted[:settings]['link_type'] || 'normal') == 'premium' ? 30 : 15
          end

          # Garantir que automations é um hash válido dentro de settings
          if permitted[:settings]['automations'].present?
            automations = permitted[:settings]['automations']
            # Coerce boolean strings vindas do JSON
            %w[reminder_1h billing_notification pix_reminder overdue payment_confirmation].each do |key|
              next unless automations.key?(key)
              automations[key] = ActiveModel::Type::Boolean.new.cast(automations[key])
            end
          end
        end
      end

      def appointment_link_json(link)
        settings  = link.settings || {}
        link_type = settings['link_type'] || (settings['days_ahead'].to_i >= 30 ? 'premium' : 'normal')

        {
          id:                link.id,
          name:              link.name,
          description:       link.description,
          active:            link.active,
          token:             link.token,
          public_url:        link.public_url,
          link_type:         link_type,
          enable_google_meet: link.enable_google_meet || false,
          service:           link.service ? { id: link.service.id, name: link.service.name } : nil,
          service_id:        link.service_id,
          professional:      link.account_user ? {
            id:   link.account_user.id,
            name: "#{link.account_user.user.first_name} #{link.account_user.user.last_name}".strip
          } : nil,
          account_user_id:   link.account_user_id,
          settings:          settings,
          created_at:        link.created_at.iso8601,
          updated_at:        link.updated_at.iso8601
        }
      end
    end
  end
end
