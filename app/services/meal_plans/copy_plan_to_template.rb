# frozen_string_literal: true

module MealPlans
  class CopyPlanToTemplate < ApplicationService
    def call
      plan     = context.plan
      account  = context.account

      ApplicationRecord.transaction do
        template = account.meal_plans.create!(
          title:             context.title.presence || plan.title,
          description:       context.description.presence || plan.description,
          notes:             plan.notes,
          template_category: context.template_category.presence || 'outro',
          is_template:       true,
          target_kcal:       plan.target_kcal,
          target_protein_g:  plan.target_protein_g,
          target_carbs_g:    plan.target_carbs_g,
          target_fat_g:      plan.target_fat_g,
          target_fiber_g:    plan.target_fiber_g
        )

        plan.meal_plan_days.order(:day_number).each do |day|
          new_day = template.meal_plan_days.create!(
            day_number: day.day_number,
            label:      day.label
          )

          day.meals.order(:position).each do |meal|
            new_meal = new_day.meals.create!(
              name:            meal.name,
              time_suggestion: meal.time_suggestion,
              notes:           meal.notes,
              position:        meal.position
            )

            meal.meal_foods.order(:position).each do |mf|
              new_meal.meal_foods.create!(
                food:     mf.food,
                quantity: mf.quantity,
                unit:     mf.unit,
                notes:    mf.notes,
                position: mf.position
              )
            end
          end
        end

        context.template = template
      end
    end
  end
end
