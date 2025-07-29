# == Schema Information
#
# Table name: statement_items
#
#  id                     :bigint           not null, primary key
#  amount_cents           :bigint           default(0), not null
#  amount_currency        :string(3)        default("BRL"), not null
#  confirmed_at           :datetime
#  discarded_at           :datetime
#  document_number        :string           not null
#  due_date               :date             not null
#  ignored_at             :datetime
#  memo                   :string           not null
#  name                   :string           not null
#  posted_at              :date             not null
#  reconciled_at          :datetime
#  status_cd              :integer          default(0), not null
#  transaction_type_cd    :integer
#  type_cd                :integer          not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  bank_account_source_id :bigint
#  bank_account_target_id :bigint
#  category_id            :bigint
#  contact_id             :bigint
#  related_transaction_id :bigint
#  statement_id           :bigint           not null
#
# Indexes
#
#  index_statement_items_on_bank_account_source_id  (bank_account_source_id)
#  index_statement_items_on_bank_account_target_id  (bank_account_target_id)
#  index_statement_items_on_category_id             (category_id)
#  index_statement_items_on_contact_id              (contact_id)
#  index_statement_items_on_discarded_at            (discarded_at)
#  index_statement_items_on_related_transaction_id  (related_transaction_id)
#  index_statement_items_on_statement_id            (statement_id)
#  index_statement_items_on_status_cd               (status_cd)
#  index_statement_items_on_transaction_type_cd     (transaction_type_cd)
#  index_statement_items_on_type_cd                 (type_cd)
#
# Foreign Keys
#
#  fk_rails_...  (bank_account_source_id => bank_accounts.id)
#  fk_rails_...  (bank_account_target_id => bank_accounts.id)
#  fk_rails_...  (category_id => domains.id)
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (related_transaction_id => transactions.id)
#  fk_rails_...  (statement_id => statements.id)
#
require "test_helper"

class StatementItemTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
