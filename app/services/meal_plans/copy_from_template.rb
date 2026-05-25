# frozen_string_literal: true

module MealPlans
  class CopyFromTemplate < ApplicationService
    def call
      template = context.template
      contact  = context.contact
      account  = context.account

      ApplicationRecord.transaction do
        plan = account.meal_plans.create!(
          contact:           contact,
          title:             context.title.presence || template.title,
          description:       template.description,
          notes:             template.notes,
          template_category: template.template_category,
          is_template:       false
        )

        template.meal_plan_days.order(:day_number).each do |day|
          new_day = plan.meal_plan_days.create!(
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

        context.meal_plan = plan
      end
    end
  end
end
