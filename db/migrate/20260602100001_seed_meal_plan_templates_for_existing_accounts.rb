# frozen_string_literal: true

class SeedMealPlanTemplatesForExistingAccounts < ActiveRecord::Migration[7.0]
  def up
    say "Semeando templates de plano alimentar para contas existentes..."

    ActsAsTenant.without_tenant do
      Account.find_each do |account|
        ActsAsTenant.with_tenant(account) do
          result = MealPlans::ImportSystemTemplates.call(account: account)
          say "  #{account.id} (#{account.try(:company)&.name || 'sem nome'}): #{result.imported} template(s) importado(s)"
        rescue => e
          say "  ERRO na conta #{account.id}: #{e.message}"
        end
      end
    end
  end

  def down
    # irreversível — não remove templates já personalizados pelos usuários
  end
end
