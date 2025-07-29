# == Schema Information
#
# Table name: document_templates
#
#  id                  :bigint           not null, primary key
#  content             :text
#  default             :boolean          default(FALSE)
#  description         :text
#  name                :string           not null
#  transaction_type_cd :integer
#  type                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#
# Indexes
#
#  index_document_templates_on_account_id                  (account_id)
#  index_document_templates_on_type_and_account_id_and_id  (type,account_id,id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class ReceiptTemplateTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
