# frozen_string_literal: true

module Api
  module V1
    class MealPlansController < ApplicationController
      before_action :set_contact
      before_action :set_plan, only: %i[show update destroy activate]

      rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { error: 'Não encontrado' }, status: :not_found }

      def index
        plans = @contact.meal_plans.recent.includes(:meal_plan_days)
        render json: { meal_plans: plans.map { |p| plan_summary_json(p) } }
      end

      def show
        render json: { meal_plan: plan_full_json(@plan) }
      end

      def create
        plan = @contact.meal_plans.build(plan_params)
        plan.account = Current.account

        if plan.save
          render json: { meal_plan: plan_summary_json(plan) }, status: :created
        else
          render json: { errors: plan.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @plan.update(plan_params)
          render json: { meal_plan: plan_full_json(@plan) }
        else
          render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @plan.destroy
        render json: { message: 'Plano removido' }
      end

      def activate
        @plan.update!(status: MealPlan::STATUSES[:active])

        whatsapp_result = MealPlans::SendWhatsappLink.call(meal_plan: @plan)
        render json: {
          meal_plan:        plan_summary_json(@plan),
          whatsapp_sent:    whatsapp_result.sent || false,
          whatsapp_error:   whatsapp_result.error
        }
      end

      # POST /contacts/:contact_id/meal_plans/from_template
      def from_template
        template = Current.account.meal_plans.templates.find(params[:template_id])

        result = MealPlans::CopyFromTemplate.call(
          template: template,
          contact:  @contact,
          account:  Current.account,
          title:    params[:title]
        )

        if result.success?
          render json: { meal_plan: plan_summary_json(result.meal_plan) }, status: :created
        else
          render json: { error: result.error || 'Erro ao criar plano' }, status: :unprocessable_entity
        end
      end

      # POST /contacts/:contact_id/meal_plans/:id/days
      def add_day
        plan = @contact.meal_plans.find(params[:id])
        next_number = (plan.meal_plan_days.maximum(:day_number) || 0) + 1
        day = plan.meal_plan_days.create!(
          day_number: next_number,
          label:      MealPlanDay::DAY_LABELS[next_number]
        )
        render json: { day: day_json(day) }, status: :created
      end

      # DELETE /contacts/:contact_id/meal_plans/:plan_id/days/:id
      def remove_day
        plan = @contact.meal_plans.find(params[:id])
        day  = plan.meal_plan_days.find(params[:day_id])
        day.destroy
        render json: { message: 'Dia removido' }
      end

      # POST /contacts/:contact_id/meal_plans/:plan_id/days/:day_id/meals
      def add_meal
        plan = @contact.meal_plans.find(params[:id])
        day  = plan.meal_plan_days.find(params[:day_id])
        position = (day.meals.maximum(:position) || -1) + 1
        meal = day.meals.create!(
          name:     params[:name] || 'Nova Refeição',
          position: position
        )
        render json: { meal: meal_json(meal) }, status: :created
      end

      # DELETE /contacts/:contact_id/meal_plans/:plan_id/days/:day_id/meals/:meal_id
      def remove_meal
        plan = @contact.meal_plans.find(params[:id])
        day  = plan.meal_plan_days.find(params[:day_id])
        meal = day.meals.find(params[:meal_id])
        meal.destroy
        render json: { message: 'Refeição removida' }
      end

      # POST /contacts/:contact_id/meal_plans/:plan_id/days/:day_id/meals/:meal_id/foods
      def add_food
        plan = @contact.meal_plans.find(params[:id])
        day  = plan.meal_plan_days.find(params[:day_id])
        meal = day.meals.find(params[:meal_id])
        food = Food.find(params[:food_id])

        position   = (meal.meal_foods.maximum(:position) || -1) + 1
        meal_food  = meal.meal_foods.create!(
          food:     food,
          quantity: params[:quantity] || 100,
          unit:     params[:unit] || 'g',
          notes:    params[:notes],
          position: position
        )
        render json: { meal_food: meal_food_json(meal_food) }, status: :created
      end

      # PATCH /contacts/:contact_id/meal_plans/:plan_id/days/:day_id/meals/:meal_id/foods/:food_item_id
      def update_food
        plan      = @contact.meal_plans.find(params[:id])
        day       = plan.meal_plan_days.find(params[:day_id])
        meal      = day.meals.find(params[:meal_id])
        meal_food = meal.meal_foods.find(params[:food_item_id])

        meal_food.update!(
          quantity: params[:quantity] || meal_food.quantity,
          unit:     params[:unit]     || meal_food.unit,
          notes:    params[:notes]
        )
        render json: { meal_food: meal_food_json(meal_food) }
      end

      # DELETE /contacts/:contact_id/meal_plans/:plan_id/days/:day_id/meals/:meal_id/foods/:food_item_id
      def remove_food
        plan      = @contact.meal_plans.find(params[:id])
        day       = plan.meal_plan_days.find(params[:day_id])
        meal      = day.meals.find(params[:meal_id])
        meal_food = meal.meal_foods.find(params[:food_item_id])
        meal_food.destroy
        render json: { message: 'Alimento removido' }
      end

      private

      def set_contact
        @contact = Current.account.contacts.find(params[:contact_id])
      end

      def set_plan
        @plan = @contact.meal_plans
          .includes(meal_plan_days: { meals: { meal_foods: :food } })
          .find(params[:id])
      end

      def plan_params
        params.require(:meal_plan).permit(
          :title, :description, :notes, :start_date, :end_date, :status,
          :target_kcal, :target_protein_g, :target_carbs_g, :target_fat_g, :target_fiber_g
        )
      end

      def plan_summary_json(plan)
        {
          id:               plan.id,
          title:            plan.title,
          description:      plan.description,
          status:           plan.status,
          public_token:     plan.public_token,
          total_days:       plan.total_days,
          start_date:       plan.start_date,
          end_date:         plan.end_date,
          updated_at:       plan.updated_at.iso8601,
          target_kcal:      plan.target_kcal.to_f,
          target_protein_g: plan.target_protein_g.to_f,
          target_carbs_g:   plan.target_carbs_g.to_f,
          target_fat_g:     plan.target_fat_g.to_f,
          target_fiber_g:   plan.target_fiber_g.to_f
        }
      end

      def plan_full_json(plan)
        plan_summary_json(plan).merge(
          notes: plan.notes,
          days:  plan.meal_plan_days.sort_by(&:day_number).map { |d| day_json(d) }
        )
      end

      def day_json(day)
        meals = day.meals.sort_by(&:position).map { |m| meal_json(m) }
        {
          id:         day.id,
          day_number: day.day_number,
          label:      day.display_label,
          meals:      meals,
          summary:    day_summary(meals)
        }
      end

      def day_summary(meals)
        {
          total_kcal:    meals.sum { |m| m[:total_kcal] }.round(1),
          total_protein: meals.sum { |m| m[:total_protein] }.round(1),
          total_carbs:   meals.sum { |m| m[:total_carbs] }.round(1),
          total_fat:     meals.sum { |m| m[:total_fat] }.round(1),
          total_fiber:   meals.sum { |m| m[:total_fiber] }.round(1)
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
          total_vitamins:  meal.total_vitamins,
          foods:           meal.meal_foods.sort_by(&:position).map { |mf| meal_food_json(mf) }
        }
      end

      def meal_food_json(mf)
        {
          id:              mf.id,
          food_id:         mf.food_id,
          food_name:       mf.food.name,
          quantity:        mf.quantity.to_f,
          unit:            mf.unit,
          notes:           mf.notes,
          kcal:            mf.kcal_snapshot.to_f,
          protein:         mf.protein_snapshot.to_f,
          carbs:           mf.carbs_snapshot.to_f,
          fat:             mf.fat_snapshot.to_f,
          fiber:           mf.fiber_snapshot.to_f,
          vitamins:        mf.vitamins_snapshot || {},
          position:        mf.position
        }
      end
    end
  end
end
