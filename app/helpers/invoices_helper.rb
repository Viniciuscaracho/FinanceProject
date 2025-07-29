module InvoicesHelper
  def invoice_badge_variant(invoice)
    case invoice.status
    when :open
      :primary
    when :paid
      :success
    when :canceled
      :warning
    else
      :default
    end
  end
end
