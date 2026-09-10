# frozen_string_literal: true

module Api
  module V1
    module English
      class SessionsController < Api::V1::ApplicationController
        def index
          sessions = EnglishSession.where(user: current_user).recent.limit(50)
          render json: sessions.as_json(only: %i[id url summary status created_at],
                                        methods: :cards_count)
        end

        def create
          result = ::English::ImportConversationService.new(
            user:     current_user,
            url:      params[:url],
            raw_text: params[:raw_text]
          ).call

          if result[:ok]
            render json: {
              session: result[:session].as_json(only: %i[id url status created_at]),
              cards:   result[:cards].map { |c| card_json(c) }
            }, status: :created
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        private

        def card_json(card)
          card.as_json(only: %i[id card_type front back example status review_count next_review_at created_at])
        end
      end
    end
  end
end
