module ApiTokensHelper

  def expires_at_options
    [
      [t('expires_at_options.never'), nil],
      [t('expires_at_options.one_day'), 1.day.from_now],
      [t('expires_at_options.one_week'), 1.week.from_now],
      [t('expires_at_options.one_month'), 1.month.from_now],
      [t('expires_at_options.six_months'), 6.months.from_now],
      [t('expires_at_options.one_year'), 1.year.from_now]
    ]
  end
end
