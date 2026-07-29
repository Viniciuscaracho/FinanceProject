# frozen_string_literal: true

require 'test_helper'

class CoachingCreditWalletTest < ActiveSupport::TestCase
  setup do
    @account = accounts(:account)
    @account.coaching_credit_wallet&.destroy
    @wallet = @account.create_coaching_credit_wallet!(
      balance: 0, monthly_allowance: 200, renews_at: nil
    )
  end

  test 'grant_monthly seeds the allowance and schedules renewal' do
    @wallet.grant_monthly!
    assert_equal 200, @wallet.balance
    assert @wallet.renews_at.present?, 'deveria agendar a próxima renovação'
    assert_equal 'monthly_grant', @wallet.transactions.last.kind
  end

  test 'grant_monthly is idempotent inside the cycle' do
    @wallet.grant_monthly!
    assert_no_difference -> { @wallet.transactions.count } do
      @wallet.grant_monthly! # renews_at ainda no futuro → não concede de novo
    end
    assert_equal 200, @wallet.reload.balance
  end

  test 'debit reduces balance and records a ledger row' do
    @wallet.update!(balance: 3)
    @wallet.debit!(amount: 1)
    assert_equal 2, @wallet.reload.balance
    tx = @wallet.transactions.recent.first
    assert_equal(-1, tx.amount)
    assert_equal 2, tx.balance_after
    assert_equal 'debit', tx.kind
  end

  test 'debit raises and keeps balance when insufficient' do
    @wallet.update!(balance: 0)
    assert_raises Coaching::CreditsService::InsufficientCredits do
      @wallet.debit!(amount: 1)
    end
    assert_equal 0, @wallet.reload.balance
    assert_equal 0, @wallet.transactions.count
  end

  test 'recharge adds credits above the allowance' do
    @wallet.update!(balance: 200)
    @wallet.recharge!(amount: 100)
    assert_equal 300, @wallet.reload.balance
    assert_equal 'recharge', @wallet.transactions.recent.first.kind
  end

  test 'renewal does not stack unused allowance but keeps recharge surplus' do
    @wallet.update!(balance: 250, renews_at: 1.day.ago) # 200 franquia + 50 recarga
    @wallet.grant_monthly!
    assert_equal 250, @wallet.reload.balance, 'excedente comprado deve ser preservado'
  end

  test 'renewal tops a depleted balance back up to the allowance' do
    @wallet.update!(balance: 15, renews_at: 1.day.ago)
    @wallet.grant_monthly!
    assert_equal 200, @wallet.reload.balance
  end
end
