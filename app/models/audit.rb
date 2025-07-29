# frozen_string_literal: true

# == Schema Information
#
# Table name: audits
#
#  id              :bigint           not null, primary key
#  action          :string
#  associated_type :string
#  auditable_type  :string
#  audited_changes :jsonb
#  comment         :string
#  remote_address  :string
#  request_uuid    :string
#  user_type       :string
#  username        :string
#  version         :integer          default(0)
#  created_at      :datetime
#  associated_id   :bigint
#  auditable_id    :bigint
#  user_id         :bigint
#
# Indexes
#
#  associated_index                           (associated_type,associated_id)
#  auditable_index                            (auditable_type,auditable_id,version)
#  index_audits_on_created_at                 (created_at)
#  index_audits_on_home_page                  (associated_id,associated_type,auditable_type,user_type)
#  index_audits_on_home_page_with_created_at  (associated_type,associated_id,auditable_type,user_type,created_at DESC)
#  index_audits_on_request_uuid               (request_uuid)
#  user_index                                 (user_id,user_type)
#
class Audit < Audited::Audit
  after_save :log_additional_information

  private

  def log_additional_information
    update_columns(username: user.try(:name)) if username.blank?
  end
end
