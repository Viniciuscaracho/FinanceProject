# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class BriefingsController < ApplicationController
        def create
          contact = Current.account.contacts.find(params[:contact_id])
          summary = ::Coaching::PreVisitSummaryService.new(contact).call
          render json: { summary: summary }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Atleta não encontrado' }, status: :not_found
        end
      end
    end
  end
end
