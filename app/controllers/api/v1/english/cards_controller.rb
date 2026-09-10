# frozen_string_literal: true

module Api
  module V1
    module English
      class CardsController < Api::V1::ApplicationController
        def index
          cards = EnglishCard.where(user: current_user)
          cards = cards.by_type(params[:card_type]) if params[:card_type].present?
          cards = cards.where(status: params[:status]) if params[:status].present?
          render json: cards.order(created_at: :desc).as_json(
            only: %i[id card_type front back example status review_count next_review_at created_at]
          )
        end

        def update
          card = EnglishCard.find_by!(id: params[:id], user: current_user)

          new_status = params[:status]
          updates = { status: new_status, review_count: card.review_count + 1 }

          if new_status == 'learning'
            # Space the next review: 1 day first, doubling each time up to 30 days
            days = [1, 2, 4, 8, 16, 30].fetch(card.review_count, 30)
            updates[:next_review_at] = days.days.from_now
          else
            updates[:next_review_at] = 30.days.from_now
          end

          card.update!(updates)
          render json: card.as_json(only: %i[id card_type front back example status review_count next_review_at])
        end

        def destroy
          card = EnglishCard.find_by!(id: params[:id], user: current_user)
          card.destroy!
          render json: { ok: true }
        end
      end
    end
  end
end
