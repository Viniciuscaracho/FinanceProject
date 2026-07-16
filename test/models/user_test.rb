# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                                                                       :bigint           not null, primary key
#  accepted_privacy_at                                                      :datetime
#  accepted_terms_at                                                        :datetime
#  admin                                                                    :boolean          default(FALSE), not null
#  api_token                                                                :string
#  collapsed_menu                                                           :boolean          default(FALSE)
#  confirmation_sent_at                                                     :datetime
#  confirmation_token                                                       :string
#  confirmed_at                                                             :datetime
#  contact_me_by                                                            :string
#  current_sign_in_at                                                       :datetime
#  current_sign_in_ip                                                       :string
#  email                                                                    :string           default(""), not null
#  encrypted_password                                                       :string           default(""), not null
#  first_name                                                               :string
#  invitation_accepted_at                                                   :datetime
#  invitation_created_at                                                    :datetime
#  invitation_limit                                                         :integer
#  invitation_sent_at                                                       :datetime
#  invitation_token                                                         :string
#  invited_by_type                                                          :string
#  last_announcement_read_at(Date of last read announcement)                :datetime         default(Thu, 04 Dec 2025 16:58:50.580944000 UTC +00:00), not null
#  last_name                                                                :string
#  last_sign_in_at                                                          :datetime
#  last_sign_in_ip                                                          :string
#  lead_code                                                                :bigint
#  onboarding_created_at                                                    :datetime
#  phone_number                                                             :string
#  postcode                                                                 :string
#  preference_all_bank_accounts                                             :boolean          default(FALSE)
#  preference_beta_tester                                                   :boolean          default(FALSE), not null
#  preference_change_date                                                   :boolean          default(FALSE)
#  preference_disable_view_recurrence                                       :boolean          default(FALSE), not null
#  preference_receive_email                                                 :boolean          default(TRUE)
#  preference_static_totalizer                                              :boolean          default(FALSE)
#  preferred_language                                                       :string
#  provider                                                                 :string
#  remember_created_at                                                      :datetime
#  reset_password_sent_at                                                   :datetime
#  reset_password_token                                                     :string
#  show_initial_tour                                                        :boolean
#  sign_in_count                                                            :integer          default(0), not null
#  time_zone                                                                :string
#  uid                                                                      :string
#  visible_amount(Whether the user can see the amount of the referral code) :boolean          default(TRUE), not null
#  whatsapp_number                                                          :string
#  zp_user                                                                  :boolean
#  created_at                                                               :datetime         not null
#  updated_at                                                               :datetime         not null
#  account_id                                                               :bigint
#  invited_by_id                                                            :bigint
#
# Indexes
#
#  index_users_on_account_id            (account_id)
#  index_users_on_confirmation_token    (confirmation_token) UNIQUE
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_invitation_token      (invitation_token) UNIQUE
#  index_users_on_provider_and_uid      (provider,uid) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require "test_helper"

class UserTest < ActiveSupport::TestCase
  # setup do
  #   @user = users(:user_one)
  # end
  #
  # test "should create an user" do
  #   user = User.new(
  #     name: "User Three",
    #     email: "three@barbermanagement.io",
  #     password: "123456",
  #     password_confirmation: "123456",
  #     admin: true,
  #   )
  #   assert_equal "User Three", user.name
    #   assert_equal "three@barbermanagement.io", user.email
  #   assert user.admin?
  #   user.name = "User One"
  # end
  #
  # test "should update an user" do
  #   @user.update!(
  #     name: "User Updated",
  #     admin: false,
  #     accepted_privacy_at: Time.now,
  #     accepted_terms_at: Time.now,
  #   )
  #   assert_equal "User Updated", @user.name
  #   assert_not @user.admin?
  # end
  #
  # test "should find an user by ID" do
  #   user = User.find(@user.id)
  #   assert_equal "User One", user.name
    #   assert_equal "one@barbermanagement.io", user.email
  #   assert user.admin?
  # end
end
