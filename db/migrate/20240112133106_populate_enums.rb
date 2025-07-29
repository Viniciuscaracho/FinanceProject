class PopulateEnums < ActiveRecord::Migration[7.0]
  def up
    return if Rails.env.test?

    NationalServiceCodes::SyncJob.perform_later
    NbsCodes::SyncJob.perform_later
    Cnaes::SyncJob.perform_later
    CitiesAndStates::SyncJob.perform_later
  end

  def down; end
end
