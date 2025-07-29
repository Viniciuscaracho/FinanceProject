class SeedContractTemplate < ActiveRecord::Migration[7.0]
  def up
    # Account.find_each do |account|
    #   ContractTemplate.create_default_templates(account)
    # end
  end

  def down
    # ContractTemplate.destroy_all
  end
end
