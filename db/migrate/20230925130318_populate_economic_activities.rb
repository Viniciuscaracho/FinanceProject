class PopulateEconomicActivities < ActiveRecord::Migration[7.0]
  def up
    # SyncEconomicActivitiesJob.perform_later
  end

  def down
    # Enums::EconomicActivity.delete_all
  end
end
