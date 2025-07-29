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
class InvoiceTemplate < DocumentTemplate
  acts_as_tenant :account

  def assign_settings(settings)
    settings.each do |key, value|
      settings(:invoice).send("#{key}=", value.to_boolean)
    end
  end

  def show_header=(value)
    settings(:invoice).show_header = value.to_boolean
  end

  def show_header
    settings(:invoice).show_header
  end

  def show_issue_date=(value)
    settings(:invoice).show_issue_date = value.to_boolean
  end

  def show_issue_date
    settings(:invoice).show_issue_date
  end

  def show_due_date=(value)
    settings(:invoice).show_due_date = value.to_boolean
  end

  def show_due_date
    settings(:invoice).show_due_date
  end

  def show_recipient=(value)
    settings(:invoice).show_recipient = value.to_boolean
  end

  def show_recipient
    settings(:invoice).show_recipient
  end

  def show_detailed_lines=(value)
    settings(:invoice).show_detailed_lines = value.to_boolean
  end

  def show_detailed_lines
    settings(:invoice).show_detailed_lines
  end

  def show_discount_info=(value)
    settings(:invoice).show_discount_info = value.to_boolean
  end

  def show_discount_info
    settings(:invoice).show_discount_info
  end

  def show_tax_info=(value)
    settings(:invoice).show_tax_info = value.to_boolean
  end

  def show_tax_info
    settings(:invoice).show_tax_info
  end

  def show_payment_info=(value)
    settings(:invoice).show_payment_info = value.to_boolean
  end

  def show_payment_info
    settings(:invoice).show_payment_info
  end

  def self.create_default_invoice_template
    return if exists?

    ApplicationRecord.connected_to(role: ActiveRecord.writing_role) do
      ApplicationRecord.transaction do
        create(name: 'Modelo Padrão', description: 'Modelo padrão de fatura')
      end
    end
  end
end
