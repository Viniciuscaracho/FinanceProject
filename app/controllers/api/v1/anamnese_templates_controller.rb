# frozen_string_literal: true

module Api
  module V1
    class AnamneseTemplatesController < ApplicationController
      before_action :set_template, only: [:show, :update, :destroy]

      def index
        templates = Current.account.anamnese_templates.active.recent
        render json: { templates: templates.as_json }
      end

      def show
        render json: { template: @template.as_json }
      end

      def create
        template = Current.account.anamnese_templates.build(template_params)
        if template.save
          render json: { template: template.as_json }, status: :created
        else
          render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @template.update(template_params)
          render json: { template: @template.as_json }
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @template.update!(active: false)
        render json: { message: 'Template arquivado com sucesso' }
      end

      private

      def set_template
        @template = Current.account.anamnese_templates.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Template não encontrado' }, status: :not_found
      end

      def template_params
        params.require(:anamnese_template).permit(:name, :description, :active, fields: [:id, :label, :type, :required, options: []])
      end
    end
  end
end
