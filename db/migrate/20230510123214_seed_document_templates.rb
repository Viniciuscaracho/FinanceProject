class SeedDocumentTemplates < ActiveRecord::Migration[7.0]
  def up
    # Account.find_each do |account|
    #   ReceiptTemplate.create_default_templates(account)
    # end
  end

  def down
    # Account.find_each do |account|
    #   account.receipt_templates.delete_all
    # end
  end
end
