# frozen_string_literal: true

module Api
  module V1
    module Coaching
      class CoachingProfilesController < ApplicationController
        def show
          profile = find_or_initialize_profile
          render json: { profile: profile_json(profile) }
        end

        def update
          profile = find_or_initialize_profile
          profile.assign_attributes(profile_params)

          if profile.save
            render json: { profile: profile_json(profile) }
          else
            render json: { errors: profile.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def find_or_initialize_profile
          contact = Current.account.contacts.find(params[:contact_id])
          contact.coaching_profile || contact.build_coaching_profile(account: Current.account)
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Atleta não encontrado' }, status: :not_found
        end

        def profile_params
          params.permit(:goal, :limitations, :next_reassessment_at)
        end

        def profile_json(profile)
          {
            id:                   profile.id,
            goal:                 profile.goal,
            limitations:          profile.limitations,
            next_reassessment_at: profile.next_reassessment_at&.iso8601,
            last_feedback_at:     profile.last_feedback_at&.iso8601
          }
        end
      end
    end
  end
end
