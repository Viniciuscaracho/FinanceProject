# frozen_string_literal: true

module Api
  module V1
    class CategoriesController < ApplicationController
      before_action :set_category, only: [:show, :update, :destroy]

      def index
        @categories = Current.account.categories
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          categories: @categories.as_json,
          meta: {
            current_page: @categories.current_page,
            total_pages: @categories.total_pages,
            total_count: @categories.total_count
          }
        }
      end

      def show
        render json: { category: @category.as_json }
      end

      def create
        @category = Current.account.categories.build(category_params)

        if @category.save
          render json: { category: @category.as_json }, status: :created
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @category.update(category_params)
          render json: { category: @category.as_json }
        else
          render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @category.destroy
        render json: { message: 'Categoria removida com sucesso' }
      end

      private

      def set_category
        @category = Current.account.categories.find(params[:id])
      end

      def category_params
        params.require(:category).permit(:name, :description, :color)
      end
    end
  end
end
