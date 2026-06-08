# frozen_string_literal: true

module Api
  module V1
    class FoodsController < ApplicationController
      # GET /api/v1/foods?q=arroz&source=taco
      # GET /api/v1/foods?q=arroz&source=open_food_facts
      # GET /api/v1/foods?q=arroz&source=custom
      def index
        q      = params[:q].to_s.strip
        source = params[:source].to_s.presence

        return render json: { foods: [] } if q.length < 2

        if source == 'open_food_facts'
          local_global  = Food.global.open_food_facts.search(q).order(:name).limit(15)
          local_account = Food.for_account(Current.account.id).open_food_facts.search(q).order(:name).limit(5)
          local_json    = (local_global + local_account).uniq(&:id).map { |f| food_json(f) }

          live_json = Foods::OpenFoodFactsSearch.by_name(q).map { |r| off_food_json(r) }

          saved_ext_ids = local_json.filter_map { |f| f[:external_id] }
          new_live      = live_json.reject { |f| saved_ext_ids.include?(f[:external_id]) }

          render json: { foods: (local_json + new_live).first(30) } and return
        end

        foods = if source == 'custom'
          Food.for_account(Current.account.id).search(q).order(:name).limit(20)
        elsif source == 'taco'
          Food.global.taco.search(q).order(:name).limit(20)
        else
          global  = Food.global.search(q).order(:name).limit(20)
          account = Food.for_account(Current.account.id).search(q).order(:name).limit(10)
          (global + account).uniq(&:id)
        end

        render json: { foods: foods.map { |f| food_json(f) } }
      end

      # GET /api/v1/foods/barcode/:barcode
      def barcode_search
        result = Foods::OpenFoodFactsSearch.by_barcode(params[:barcode])

        if result
          render json: { food: off_food_json(result) }
        else
          render json: { error: 'Produto não encontrado' }, status: :not_found
        end
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
        params.require(:food).permit(
          :name, :brand, :kcal_per_100g, :protein_per_100g,
          :carbs_per_100g, :fat_per_100g, :fiber_per_100g,
          :external_id, vitamins_per_100g: {}
        )
      end

      def food_json(food)
        {
          id:               food.id,
          external_id:      food.external_id,
          name:             food.name,
          brand:            food.brand,
          source:           food.source,
          kcal_per_100g:    food.kcal_per_100g.to_f,
          protein_per_100g: food.protein_per_100g.to_f,
          carbs_per_100g:   food.carbs_per_100g.to_f,
          fat_per_100g:     food.fat_per_100g.to_f,
          fiber_per_100g:   food.fiber_per_100g.to_f
        }
      end

      # Open Food Facts results are not persisted — return as-is for the frontend
      def off_food_json(data)
        {
          id:               nil,
          external_id:      data[:external_id],
          name:             data[:name],
          brand:            data[:brand],
          source:           'open_food_facts',
          kcal_per_100g:    data[:kcal_per_100g].to_f,
          protein_per_100g: data[:protein_per_100g].to_f,
          carbs_per_100g:   data[:carbs_per_100g].to_f,
          fat_per_100g:     data[:fat_per_100g].to_f,
          fiber_per_100g:   data[:fiber_per_100g].to_f
        }
      end
    end
  end
end
