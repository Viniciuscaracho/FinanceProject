class PurgeAudits < ActiveRecord::Migration[7.0]
  def change
    Audit.delete_all
  end
end
