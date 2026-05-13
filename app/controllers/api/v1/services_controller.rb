# frozen_string_literal: true

module Api
  module V1
    class ServicesController < ApplicationController
      before_action :set_service, only: [:show, :update, :destroy]

      # GET /api/v1/services
      def index
        services = current_account.services
                                  .provideds
                                  .where(enabled: 't')
                                  .order(:name)

        render json: services.map { |s| service_json(s) }
      end

      # GET /api/v1/services/:id
      def show
        render json: service_json(@service)
      end

      # POST /api/v1/services
      def create
        service = current_account.services.build(service_params)
        service.offer_type_cd = Service::SERVICE_TYPES[:provided]
        service.enabled = 't'

        if service.save
          render json: service_json(service), status: :created
        else
          render json: { errors: service.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/services/:id
      def update
        if @service.update(service_params)
          render json: service_json(@service)
        else
          render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/services/:id
      def destroy
        @service.discard!
        head :no_content
      end

      private

      def current_account
        Current.account
      end

      def set_service
        @service = current_account.services.find(params[:id])
      end

      def service_params
        params.require(:service).permit(
          :name, :description, :unit,
          :cost_price_cents, :selling_price_cents,
          :currency, :internal_code,
          :modality, :meeting_url
        )
      end

      def service_json(service)
        {
          id: service.id,
          name: service.name,
          description: service.description,
          unit: service.unit,
          modality: Service::MODALITIES.key(service.modality || 0)&.to_s || 'presencial',
          meeting_url: service.meeting_url,
          cost_price: {
            cents: service.cost_price_cents,
            currency: service.currency,
            formatted: Money.new(service.cost_price_cents, service.currency).format
          },
          selling_price: {
            cents: service.selling_price_cents,
            currency: service.currency,
            formatted: Money.new(service.selling_price_cents, service.currency).format
          },
          enabled: service.enabled == 't',
          created_at: service.created_at.iso8601,
          updated_at: service.updated_at.iso8601
        }
      end
    end
  end
end

