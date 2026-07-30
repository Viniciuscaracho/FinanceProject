module Api
  module V1
    module Coaching
      class AssessmentsController < ApplicationController
        before_action :set_contact

        def index
          assessments = CoachingAssessment
            .where(account: Current.account, contact: @contact)
            .chronological
          render json: { assessments: assessments.map { |a| assessment_json(a) } }
        end

        def create
          assessment = CoachingAssessment.new(assessment_params)
          assessment.account      = Current.account
          assessment.contact      = @contact
          assessment.account_user = Current.account_user

          if assessment.save
            render json: { assessment: assessment_json(assessment) }, status: :created
          else
            render json: { errors: assessment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_contact
          @contact = Current.account.contacts.find(params[:contact_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Atleta não encontrado' }, status: :not_found
        end

        def assessment_params
          params.require(:assessment).permit(
            :weight_kg, :body_fat_pct, :muscle_mass_kg, :visceral_fat_index,
            :waist_cm, :hip_cm, :chest_cm, :arm_cm, :thigh_cm,
            :resting_hr_bpm, :blood_pressure,
            :push_up_reps, :squat_reps, :plank_seconds, :vo2max_estimate,
            :energy_score, :sleep_score, :stress_score, :motivation_score,
            :assessed_on, :assessment_type, :notes
          )
        end

        def assessment_json(a)
          {
            id:                 a.id,
            assessed_on:        a.assessed_on,
            assessment_type:    a.assessment_type,
            weight_kg:          a.weight_kg,
            body_fat_pct:       a.body_fat_pct,
            muscle_mass_kg:     a.muscle_mass_kg,
            visceral_fat_index: a.visceral_fat_index,
            waist_cm:           a.waist_cm,
            hip_cm:             a.hip_cm,
            chest_cm:           a.chest_cm,
            arm_cm:             a.arm_cm,
            thigh_cm:           a.thigh_cm,
            resting_hr_bpm:     a.resting_hr_bpm,
            blood_pressure:     a.blood_pressure,
            push_up_reps:       a.push_up_reps,
            squat_reps:         a.squat_reps,
            plank_seconds:      a.plank_seconds,
            vo2max_estimate:    a.vo2max_estimate,
            energy_score:       a.energy_score,
            sleep_score:        a.sleep_score,
            stress_score:       a.stress_score,
            motivation_score:   a.motivation_score,
            notes:              a.notes,
            created_at:         a.created_at,
          }
        end
      end
    end
  end
end
