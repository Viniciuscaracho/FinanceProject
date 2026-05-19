# frozen_string_literal: true

module Api
  module V1
    class FoodsController < ApplicationController
      def index
        q = params[:q].to_s.strip
        return render json: { foods: [] } if q.length < 2

        global_foods  = Food.global.search(q).order(:name).limit(20)
        account_foods = Food.for_account(Current.account.id).search(q).order(:name).limit(10)

        foods = (global_foods + account_foods).uniq(&:id)
        render json: { foods: foods.map { |f| food_json(f) } }
      end

      def create
        food = Food.new(food_params)
        food.account = Current.account
        food.source  = 'custom'

        if food.save
          render json: { food: food_json(food) }, status: :created
        else
          render json: { errors: food.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        food = Food.for_account(Current.account.id).find(params[:id])
        food.destroy
        render json: { message: 'Alimento removido' }
      end

      private

      def food_params
        params.require(:food).permit(:name, :kcal_per_100g, :protein_per_100g,
                                     :carbs_per_100g, :fat_per_100g, :fiber_per_100g)
      end

      def food_json(food)
        {
          id:              food.id,
          name:            food.name,
          kcal_per_100g:   food.kcal_per_100g.to_f,
          protein_per_100g: food.protein_per_100g.to_f,
          carbs_per_100g:  food.carbs_per_100g.to_f,
          fat_per_100g:    food.fat_per_100g.to_f,
          fiber_per_100g:  food.fiber_per_100g.to_f,
          source:          food.source
        }
      end
    end
  end
end
