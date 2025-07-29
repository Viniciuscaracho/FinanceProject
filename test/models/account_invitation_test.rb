# frozen_string_literal: true

# == Schema Information
#
# Table name: account_invitations
#
#  id            :bigint           not null, primary key
#  email         :string           not null
#  name          :string
#  role_cd       :integer          default(0), not null
#  token         :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  invited_by_id :bigint           not null
#
# Indexes
#
#  index_account_invitations_on_account_id     (account_id)
#  index_account_invitations_on_invited_by_id  (invited_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (invited_by_id => users.id)
#

require 'test_helper'


class AccountInvitationTest < ActiveSupport::TestCase
  self.use_instantiated_fixtures = true

  fixtures :users, :accounts, :companies
  def setup
    @user = users(:user_one)
    @account = accounts(:account)
    @account_invitations = create_account_invitation(@account, @user)
  end

  test 'should be valid' do
    assert @account_invitations.valid?
  end

  test 'email should be present' do
    @account_invitations.email = ' '
    assert_not @account_invitations.valid?
  end

  test 'name should be present' do
    @account_invitations.name = ' '
    assert_not @account_invitations.valid?
  end

  test 'email validation should accept valid addresses' do
    valid_addresses = %w[user@example.com USER@foo.COM A_US-ER@foo.bar.org
                         first.last@foo.jp alice+bob@baz.cn]
    valid_addresses.each do |valid_address|
      @account_invitations.email = valid_address
      assert @account_invitations.valid?, "#{valid_address.inspect} should be valid"
    end
  end

  test 'email validation should reject invalid addresses' do
    invalid_addresses = %w[user@example,com user_at_foo.org user.name@example.
                           foo@bar_baz.com foo@bar+baz.com]
    invalid_addresses.each do |invalid_address|
      @account_invitations.email = invalid_address
      assert_not @account_invitations.valid?, "#{invalid_address.inspect} should be invalid"
    end
  end

  test 'Should create account when a user accepts an invitation' do
    user = users(:user_two)
    assert_difference 'AccountUser.count', 1 do
      @account_invitations.accept!(user)
    end
  end

  test 'Should destroy account_invitations when an invitation is rejected' do
    assert_difference 'AccountInvitation.count', -1 do
      @account_invitations.reject!
    end
  end
end
