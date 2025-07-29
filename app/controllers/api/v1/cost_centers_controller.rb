# frozen_string_literal: true

module Api
  module V1
    class CostCentersController < ApplicationController
      before_action :set_cost_center, only: [:show, :update, :destroy]

      def index
        @cost_centers = Current.account.cost_centers
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          cost_centers: @cost_centers.as_json,
          meta: {
            current_page: @cost_centers.current_page,
            total_pages: @cost_centers.total_pages,
            total_count: @cost_centers.total_count
          }
        }
      end

      def show
        render json: { cost_center: @cost_center.as_json }
      end

      def create
        @cost_center = Current.account.cost_centers.build(cost_center_params)

        if @cost_center.save
          render json: { cost_center: @cost_center.as_json }, status: :created
        else
          render json: { errors: @cost_center.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @cost_center.update(cost_center_params)
          render json: { cost_center: @cost_center.as_json }
        else
          render json: { errors: @cost_center.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @cost_center.destroy
        render json: { message: 'Centro de custo removido com sucesso' }
      end

      private

      def set_cost_center
        @cost_center = Current.account.cost_centers.find(params[:id])
      end

      def cost_center_params
        params.require(:cost_center).permit(:name, :description)
      end
    end
  end
end
