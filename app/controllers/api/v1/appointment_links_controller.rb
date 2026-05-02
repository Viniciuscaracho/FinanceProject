# frozen_string_literal: true

module Api
  module V1
    class AppointmentLinksController < ApplicationController
      before_action :set_appointment_link, only: [:show, :update, :destroy]
      
      # GET /api/v1/appointment_links
      def index
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end
          
          links = account.appointment_links.includes(:service, :account_user).order(created_at: :desc)
          
          render json: links.map { |link| appointment_link_json(link) }
        rescue => e
          Rails.logger.error "Error in appointment_links#index: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end
      
      # GET /api/v1/appointment_links/:id
      def show
        render json: appointment_link_json(@appointment_link)
      end
      
      # POST /api/v1/appointment_links
      def create
        begin
          account = Current.account
          unless account
            render json: { error: 'Account not found' }, status: :forbidden
            return
          end
          
          link = account.appointment_links.build(appointment_link_params)
          
          if link.save
            render json: appointment_link_json(link), status: :created
          else
            render json: { errors: link.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointment_links#create: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end
      
      # PATCH /api/v1/appointment_links/:id
      def update
        begin
          if @appointment_link.update(appointment_link_params)
            render json: appointment_link_json(@appointment_link)
          else
            render json: { errors: @appointment_link.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error in appointment_links#update: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: e.message }, status: :internal_server_error
        end
      end
      
      # DELETE /api/v1/appointment_links/:id
      def destroy
        @appointment_link.destroy
        head :no_content
      end
      
      private
      
      def set_appointment_link
        account = Current.account
        unless account
          render json: { error: 'Account not found' }, status: :forbidden
          return
        end
        
        @appointment_link = account.appointment_links.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Link de agendamento não encontrado' }, status: :not_found
      end
      
      def appointment_link_params
        params.require(:appointment_link).permit(
          :name,
          :description,
          :active,
          :service_id,
          :account_user_id,
          :link_type,
          :enable_google_meet,
          settings: {}
        ).tap do |permitted|
          # Garantir que settings seja um hash
          if permitted[:settings].present? && permitted[:settings].is_a?(String)
            permitted[:settings] = JSON.parse(permitted[:settings]) rescue {}
          end
          
          permitted[:settings] ||= {}
          
          # Processar link_type e days_ahead
          link_type = permitted.delete(:link_type) || params[:appointment_link]&.dig(:link_type)
          if link_type.present?
            permitted[:settings]['link_type'] = link_type
          end
          
          # Garantir que days_ahead esteja definido
          unless permitted[:settings].key?('days_ahead')
            link_type_for_default = permitted[:settings]['link_type'] || 'normal'
            permitted[:settings]['days_ahead'] = link_type_for_default == 'premium' ? 30 : 15
          end
        end
      end
      
      def appointment_link_json(link)
        settings = link.settings || {}
        link_type = settings['link_type'] || (settings['days_ahead'].to_i >= 30 ? 'premium' : 'normal')
        
        {
          id: link.id,
          name: link.name,
          description: link.description,
          active: link.active,
          token: link.token,
          public_url: link.public_url,
          link_type: link_type,
          enable_google_meet: link.enable_google_meet || false,
          service: link.service ? {
            id: link.service.id,
            name: link.service.name
          } : nil,
          service_id: link.service_id,
          professional: link.account_user ? {
            id: link.account_user.id,
            name: "#{link.account_user.user.first_name} #{link.account_user.user.last_name}".strip
          } : nil,
          account_user_id: link.account_user_id,
          settings: settings,
          created_at: link.created_at.iso8601,
          updated_at: link.updated_at.iso8601
        }
      end
    end
  end
end

