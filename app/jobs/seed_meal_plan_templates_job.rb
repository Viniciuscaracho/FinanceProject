class SeedMealPlanTemplatesJob < ApplicationJob
  queue_as :default

  def perform(account)
    ActsAsTenant.with_tenant(account) do
      MealPlans::ImportSystemTemplates.call(account: account)
    end
  end
end
