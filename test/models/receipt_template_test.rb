# == Schema Information
#
# Table name: document_templates
#
#  id                                                                                  :bigint           not null, primary key
#  content                                                                             :text
#  default                                                                             :boolean          default(FALSE)
#  description                                                                         :text
#  enable_sessions                                                                     :boolean          default(FALSE), not null
#  name                                                                                :string           not null
#  professional_type(Tipo de profissional (psicólogo, professor, nutricionista, etc.)) :string
#  session_count                                                                       :integer
#  session_number                                                                      :integer
#  session_type                                                                        :string
#  transaction_type_cd                                                                 :integer
#  type                                                                                :string
#  created_at                                                                          :datetime         not null
#  updated_at                                                                          :datetime         not null
#  account_id                                                                          :bigint           not null
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
