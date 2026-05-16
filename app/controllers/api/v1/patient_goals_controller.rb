# frozen_string_literal: true

module Api
  module V1
    class PatientGoalsController < ApplicationController
      before_action :set_contact
      before_action :set_goal, only: [:update, :destroy, :add_progress]

      def index
        goals = Current.account.patient_goals.for_contact(@contact.id).recent
        render json: { goals: goals.as_json }
      end

      def create
        goal = Current.account.patient_goals.build(goal_params.merge(contact_id: @contact.id))
        if goal.save
          render json: { goal: goal.as_json }, status: :created
        else
          render json: { errors: goal.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @goal.update(goal_params)
          render json: { goal: @goal.as_json }
        else
          render json: { errors: @goal.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @goal.destroy
        render json: { message: 'Meta removida com sucesso' }
      end

      def add_progress
        value = params[:value]&.to_f
        note  = params[:note]
        date  = params[:date] ? Date.parse(params[:date]) : Date.current

        if @goal.add_progress(value, note, date)
          render json: { goal: @goal.as_json, message: 'Progresso registrado' }
        else
          render json: { errors: @goal.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:contact_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Contato não encontrado' }, status: :not_found
      end

      def set_goal
        @goal = Current.account.patient_goals.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Meta não encontrada' }, status: :not_found
      end

      def goal_params
        params.require(:patient_goal).permit(:title, :unit, :target_value, :current_value, :deadline, :notes, :status)
      end
    end
  end
end
