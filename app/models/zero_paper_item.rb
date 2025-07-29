# frozen_string_literal: true

# == Schema Information
#
# Table name: zero_paper_items
#
#  id               :bigint           not null, primary key
#  amount           :float
#  bank_account     :string
#  category         :string
#  competency_date  :date
#  contact          :string
#  cost_center      :string
#  description      :text
#  document_number  :string
#  due_date         :date
#  imported         :boolean          default(FALSE), not null
#  name             :string
#  paid             :boolean
#  payment_method   :string
#  tags             :string
#  transaction_type :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  import_id        :bigint           not null
#
# Indexes
#
#  index_zero_paper_items_on_filters    (transaction_type,due_date,name,amount,paid)
#  index_zero_paper_items_on_import_id  (import_id)
#  index_zero_paper_items_on_imported   (imported)
#
# Foreign Keys
#
#  fk_rails_...  (import_id => imports.id)
#
class ZeroPaperItem < ApplicationRecord
  belongs_to :import
end
