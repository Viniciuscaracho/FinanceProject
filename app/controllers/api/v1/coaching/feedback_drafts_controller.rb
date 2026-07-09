# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class FeedbackDraftsController < ApplicationController
        def create
          contact = Current.account.contacts.find(params[:id])
          last_event = TimelineEvent.for_contact(contact.id).recent.first

          unless last_event
            return render json: { error: 'Nenhum registro encontrado para este atleta' }, status: :unprocessable_entity
          end

          draft = ::Coaching::FeedbackDraftService.new(contact, last_event).call
          render json: { draft: draft }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Atleta não encontrado' }, status: :not_found
        end
      end
    end
  end
end
