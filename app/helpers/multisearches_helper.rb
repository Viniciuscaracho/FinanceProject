module MultisearchesHelper

  def payment_status_multisearch_filter_options
    {
      t('transactions.filter.paid') => :paid,
      t("not_paid") => :on_time,
      t('transactions.filter.due_today') => :due_today,
      t('transactions.filter.delayed') => :delayed
    }

  end
end
