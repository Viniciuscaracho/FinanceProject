# frozen_string_literal: true

# Adiciona 4 alimentos globais TACO + 5 templates esportivos a todas as contas existentes.
class SeedSportMealPlanTemplates < ActiveRecord::Migration[7.0]
  def up
    new_foods = [
      { name: 'Macarrão integral cozido', kcal: 124, protein: 5.0,  carbs: 26.3, fat: 0.8,  fiber: 3.2 },
      { name: 'Granola tradicional',      kcal: 408, protein: 9.8,  carbs: 64.5, fat: 14.2, fiber: 5.3 },
      { name: 'Uva passa',                kcal: 303, protein: 3.2,  carbs: 79.4, fat: 0.5,  fiber: 3.7 },
      { name: 'Semente de chia',          kcal: 490, protein: 15.6, carbs: 42.1, fat: 30.7, fiber: 34.4 },
    ]

    new_foods.each do |attrs|
      next if Food.exists?(name: attrs[:name], account_id: nil)

      Food.create!(
        name:             attrs[:name],
        source:           'taco',
        kcal_per_100g:    attrs[:kcal],
        protein_per_100g: attrs[:protein],
        carbs_per_100g:   attrs[:carbs],
        fat_per_100g:     attrs[:fat],
        fiber_per_100g:   attrs[:fiber]
      )
    end

    Account.find_each do |account|
      MealPlans::ImportSystemTemplates.call(account: account)
    rescue => e
      Rails.logger.warn "[SeedSportTemplates] account #{account.id}: #{e.message}"
    end
  end

  def down
    titles = [
      'Corrida — Resistência e Endurance',
      'CrossFit — Alta Intensidade',
      'Futebol — Esportes Coletivos',
      'Natação — Alto Volume',
      'Artes Marciais — Controle de Peso',
    ]
    MealPlan.where(is_template: true, title: titles).destroy_all

    Food.where(name: %w[
      'Macarrão integral cozido' 'Granola tradicional' 'Uva passa' 'Semente de chia'
    ], account_id: nil).destroy_all
  end
end
