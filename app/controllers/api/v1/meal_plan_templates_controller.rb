# frozen_string_literal: true

module Api
  module V1
    class MealPlanTemplatesController < ApplicationController
      before_action :set_template, only: %i[show update destroy add_day remove_day add_meal remove_meal add_food update_food remove_food]

      def index
        templates = Current.account.meal_plans.templates.recent
          .includes(:meal_plan_days)
        render json: { templates: templates.map { |t| template_summary_json(t) } }
      end

      def show
        render json: { template: template_full_json(@template) }
      end

      def create
        template = Current.account.meal_plans.build(template_params)
        template.is_template = true

        if template.save
          render json: { template: template_summary_json(template) }, status: :created
        else
          render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @template.update(template_params)
          render json: { template: template_full_json(@template) }
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @template.destroy
        render json: { message: 'Template removido' }
      end

      def add_day
        next_number = (@template.meal_plan_days.maximum(:day_number) || 0) + 1
        day = @template.meal_plan_days.create!(
          day_number: next_number,
          label:      MealPlanDay::DAY_LABELS[next_number]
        )
        render json: { day: day_json(day) }, status: :created
      end

      def remove_day
        day = @template.meal_plan_days.find(params[:day_id])
        day.destroy
        render json: { message: 'Dia removido' }
      end

      def add_meal
        day      = @template.meal_plan_days.find(params[:day_id])
        position = (day.meals.maximum(:position) || -1) + 1
        meal     = day.meals.create!(name: params[:name] || 'Nova Refeição', position: position)
        render json: { meal: meal_json(meal) }, status: :created
      end

      def remove_meal
        day  = @template.meal_plan_days.find(params[:day_id])
        meal = day.meals.find(params[:meal_id])
        meal.destroy
        render json: { message: 'Refeição removida' }
      end

      def add_food
        day       = @template.meal_plan_days.find(params[:day_id])
        meal      = day.meals.find(params[:meal_id])
        food      = Current.account.foods.find(params[:food_id])
        position  = (meal.meal_foods.maximum(:position) || -1) + 1
        meal_food = meal.meal_foods.create!(
          food:     food,
          quantity: params[:quantity] || 100,
          unit:     params[:unit] || 'g',
          notes:    params[:notes],
          position: position
        )
        render json: { meal_food: meal_food_json(meal_food) }, status: :created
      end

      def update_food
        day       = @template.meal_plan_days.find(params[:day_id])
        meal      = day.meals.find(params[:meal_id])
        meal_food = meal.meal_foods.find(params[:food_item_id])
        meal_food.update!(
          quantity: params[:quantity] || meal_food.quantity,
          unit:     params[:unit]     || meal_food.unit,
          notes:    params[:notes]
        )
        render json: { meal_food: meal_food_json(meal_food) }
      end

      def remove_food
        day       = @template.meal_plan_days.find(params[:day_id])
        meal      = day.meals.find(params[:meal_id])
        meal_food = meal.meal_foods.find(params[:food_item_id])
        meal_food.destroy
        render json: { message: 'Alimento removido' }
      end

      private

      def set_template
        @template = Current.account.meal_plans.templates.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Template não encontrado' }, status: :not_found
      end

      def template_params
        params.require(:meal_plan).permit(:title, :description, :notes, :template_category)
      end

      def template_summary_json(t)
        {
          id:                t.id,
          title:             t.title,
          description:       t.description,
          template_category: t.template_category,
          total_days:        t.total_days,
          updated_at:        t.updated_at.iso8601
        }
      end

      def template_full_json(t)
        template_summary_json(t).merge(
          notes: t.notes,
          days:  t.meal_plan_days.sort_by(&:day_number).map { |d| day_json(d) }
        )
      end

      def day_json(day)
        {
          id:         day.id,
          day_number: day.day_number,
          label:      day.display_label,
          meals:      day.meals.sort_by(&:position).map { |m| meal_json(m) }
        }
      end

      def meal_json(meal)
        {
          id:              meal.id,
          name:            meal.name,
          time_suggestion: meal.time_suggestion,
          notes:           meal.notes,
          position:        meal.position,
          total_kcal:      meal.total_kcal.round(1),
          total_protein:   meal.total_protein.round(1),
          total_carbs:     meal.total_carbs.round(1),
          total_fat:       meal.total_fat.round(1),
          total_fiber:     meal.total_fiber.round(1),
          foods:           meal.meal_foods.sort_by(&:position).map { |mf| meal_food_json(mf) }
        }
      end

      def meal_food_json(mf)
        {
          id:        mf.id,
          food_id:   mf.food_id,
          food_name: mf.food.name,
          quantity:  mf.quantity.to_f,
          unit:      mf.unit,
          notes:     mf.notes,
          kcal:      mf.kcal_snapshot.to_f,
          protein:   mf.protein_snapshot.to_f,
          carbs:     mf.carbs_snapshot.to_f,
          fat:       mf.fat_snapshot.to_f,
          fiber:     mf.fiber_snapshot.to_f,
          position:  mf.position
        }
      end
    end
  end
end
