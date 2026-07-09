# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class PreVisitSummariesController < ApplicationController
        def create
          appointment = Current.account.appointments.find(params[:id])
          contact = appointment.contact

          summary = ::Coaching::PreVisitSummaryService.new(contact).call
          render json: { summary: summary }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Agendamento não encontrado' }, status: :not_found
        end
      end
    end
  end
end
