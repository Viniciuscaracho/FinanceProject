# frozen_string_literal: true

# == Schema Information
#
# Table name: account_users
#
#  id                    :bigint           not null, primary key
#  commission_percentage :decimal(8, 2)    default(50.0), not null
#  policies              :jsonb            not null
#  role_cd               :integer          default(0), not null
#  schedule              :jsonb
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  account_id            :bigint           not null
#  user_id               :bigint           not null
#
# Indexes
#
#  index_account_users_on_account_id              (account_id)
#  index_account_users_on_account_id_and_user_id  (account_id,user_id) UNIQUE
#  index_account_users_on_role_cd                 (role_cd)
#  index_account_users_on_schedule                (schedule) USING gin
#  index_account_users_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (user_id => users.id)
#
require 'test_helper'

class AccountUserTest < ActiveSupport::TestCase
  # test 'the truth' do
  #   assert true
  # end
end
