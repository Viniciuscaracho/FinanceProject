# frozen_string_literal: true

module Api
  module V1
    module Public
      class MealPlansController < ActionController::API
        def show
          plan = MealPlan
            .includes(:account, :contact, meal_plan_days: { meals: { meal_foods: :food } })
            .find_by(public_token: params[:token], status: MealPlan::STATUSES[:active])
          return render json: { error: 'Plano não encontrado ou não compartilhado' }, status: :not_found unless plan

          account = plan.account
          contact = plan.contact

          render json: {
            meal_plan: {
              title:       plan.title,
              description: plan.description,
              notes:       plan.notes,
              start_date:  plan.start_date,
              end_date:    plan.end_date,
              updated_at:  plan.updated_at.iso8601,
              days:        plan.meal_plan_days.sort_by(&:day_number).map { |d| day_json(d) }
            },
            professional: {
              name:  account.company&.name || account.users.first&.full_name
            },
            patient: {
              name: contact.name
            }
          }
        end

        private

        def day_json(day)
          {
            day_number: day.day_number,
            label:      day.display_label,
            meals:      day.meals.sort_by(&:position).map { |m| meal_json(m) }
          }
        end

        def meal_json(meal)
          {
            name:            meal.name,
            time_suggestion: meal.time_suggestion,
            notes:           meal.notes,
            total_kcal:      meal.total_kcal.round(1),
            total_protein:   meal.total_protein.round(1),
            total_carbs:     meal.total_carbs.round(1),
            total_fat:       meal.total_fat.round(1),
            foods:           meal.meal_foods.sort_by(&:position).map { |mf| meal_food_json(mf) }
          }
        end

        def meal_food_json(mf)
          {
            food_name: mf.food.name,
            quantity:  mf.quantity.to_f,
            unit:      mf.unit,
            notes:     mf.notes,
            kcal:      mf.kcal_snapshot.to_f,
            protein:   mf.protein_snapshot.to_f,
            carbs:     mf.carbs_snapshot.to_f,
            fat:       mf.fat_snapshot.to_f
          }
        end
      end
    end
  end
end
