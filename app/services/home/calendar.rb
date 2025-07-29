# frozen_string_literal: true

module Home
  class Calendar < ApplicationService
    TRANSACTION_TYPES = {
      revenue: 0,
      expense: [1, 2, 3, 4]
    }.freeze

    def call
      context.result = []

      transactions = context.account.transactions.only_simple_and_children.only_unpaid.where(due_date: context.period)
      transactions = if context.bank_account.present?
                       transactions.where(bank_account: context.bank_account)
                     else
                       transactions.where(bank_account: context.account.bank_accounts.kept)
                     end
      transactions = transactions.group(:due_date, :transaction_type_cd).count

      result = {}
      context.period.each do |date|
        result[date] ||= { revenue: false, expense: false, birthday: false }
      end

      transactions.each do |(key, _value)|
        case key.last
        when TRANSACTION_TYPES[:revenue]
          result[key.first].merge!(revenue: true)
        when *TRANSACTION_TYPES[:expense]
          result[key.first].merge!(expense: true)
        end
      end

      where = <<-SQL.squish
        birth_date is not null
        AND (
            (make_date(?, extract(month from birth_date)::int, extract(day from birth_date)::int), make_date(?, extract(month from birth_date)::int, extract(day from birth_date)::int))
            OVERLAPS (?, ?)
        )
      SQL

      birth_dates = context.account.contacts
                           .where(where, context.period.first.year, context.period.last.year, context.period.first, context.period.last)
                           .pluck(:birth_date)
      birth_dates.each do |date|
        result.each do |(key, _)|
          result[key].merge!(birthday: true) if key.day == date.day && key.month == date.month
        end
      end

      result.each do |item|
        context.result << build_day(item)
      end
    end

    private

    def build_day(item)
      date = item.first
      value = item.last

      {
        date:,
        day: date.day,
        current?: date == Date.current,
        this_month?: date.month == context.date.month,
        transaction: {
          revenue?: value[:revenue],
          expense?: value[:expense]
        },
        birthday?: value[:birthday]
      }
    end

    def transaction(date)
      transactions = context.account.transactions.only_simple_and_children.only_unpaid.where(due_date: date)
      transactions = if context.bank_account.present?
                       transactions.where(bank_account: context.bank_account)
                     else
                       transactions.where(bank_account: context.account.bank_accounts.kept)
                     end
      transactions = transactions.group(:transaction_type_cd).count

      {
        revenue?: transactions.include?(TRANSACTION_TYPES[:revenue]),
        expense?: expense?(transactions)
      }
    end

    def expense?(transactions)
      TRANSACTION_TYPES[:expense].each do |type|
        return true if transactions.include?(type)
      end

      false
    end

    def birthday(date)
      context.account.contacts.birthday_by_day_and_month(day: date.day, month: date.month).any?
    end
  end
end
